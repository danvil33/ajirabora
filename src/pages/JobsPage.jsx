// src/pages/JobsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../firebase/config";

import { getJobs } from "../services/jobService";
import { useAuth } from "../Context/AuthContext";
import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";

import {
  BiBriefcase,
  BiBuilding,
  BiCheckCircle,
  BiFilterAlt,
  BiMapPin,
  BiMoney,
  BiSearch,
  BiTimeFive,
  BiX,
  BiTrendingUp,
  BiFile,
} from "react-icons/bi";

import {
  FaExternalLinkAlt,
  FaFacebook,
  FaGlobe,
  FaLinkedin,
  FaRegBookmark,
  FaBookmark,
  FaWhatsapp,
} from "react-icons/fa";

import { SiIndeed, SiLinkedin } from "react-icons/si";

const JobsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [companyTerm, setCompanyTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");
  const [sortBy, setSortBy] = useState("Newest");

  const [selectedType, setSelectedType] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedSource, setSelectedSource] = useState("");

  const [selectedJobId, setSelectedJobId] = useState(null);
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [savingJobId, setSavingJobId] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (user) {
      fetchSavedJobs();
    } else {
      setSavedJobIds([]);
    }
  }, [user]);

  const fetchJobs = async () => {
    try {
      const fetchedJobs = await getJobs();
      setJobs(fetchedJobs || []);

      if (fetchedJobs?.length > 0) {
        setSelectedJobId(fetchedJobs[0].id);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedJobs = async () => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setSavedJobIds(userSnap.data()?.savedJobs || []);
      } else {
        setSavedJobIds([]);
      }
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
      setSavedJobIds([]);
    }
  };

  const toggleSavedJob = async (jobId) => {
    if (!user) {
      navigate("/login");
      return;
    }

    setSavingJobId(jobId);

    const userRef = doc(db, "users", user.uid);
    const isSaved = savedJobIds.includes(jobId);

    setSavedJobIds((prev) =>
      isSaved ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );

    try {
      await setDoc(
        userRef,
        {
          savedJobs: isSaved ? arrayRemove(jobId) : arrayUnion(jobId),
          email: user.email || "",
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error toggling saved job:", error);

      setSavedJobIds((prev) =>
        isSaved ? [...prev, jobId] : prev.filter((id) => id !== jobId)
      );
    } finally {
      setSavingJobId(null);
    }
  };

  const jobTypes = useMemo(() => {
    const types = jobs.map((job) => job.type).filter(Boolean);
    return [...new Set(types)];
  }, [jobs]);

  const jobLevels = useMemo(() => {
    const levels = jobs.map((job) => job.level).filter(Boolean);
    return [...new Set(levels)];
  }, [jobs]);

  const jobSources = useMemo(() => {
    return [
      {
        label: "Direct Apply",
        value: "internal",
      },
      {
        label: "External Jobs",
        value: "external",
      },
    ];
  }, []);

  const companyOptions = useMemo(() => {
    const map = {};

    jobs.forEach((job) => {
      if (job.company) {
        map[job.company] = (map[job.company] || 0) + 1;
      }
    });

    return Object.entries(map)
      .slice(0, 8)
      .map(([name, count]) => ({
        name,
        count,
      }));
  }, [jobs]);

  const locationOptions = useMemo(() => {
    const map = {};

    jobs.forEach((job) => {
      if (job.location) {
        map[job.location] = (map[job.location] || 0) + 1;
      }
    });

    return Object.entries(map)
      .slice(0, 8)
      .map(([name, count]) => ({
        name,
        count,
      }));
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    let filtered = [...jobs];

    if (searchTerm.trim()) {
      const text = searchTerm.toLowerCase();

      filtered = filtered.filter((job) => {
        const searchArea = `
          ${job.title || ""}
          ${job.company || ""}
          ${job.description || ""}
          ${job.requirements || ""}
        `.toLowerCase();

        return searchArea.includes(text);
      });
    }

    if (companyTerm.trim()) {
      filtered = filtered.filter((job) =>
        job.company?.toLowerCase().includes(companyTerm.toLowerCase())
      );
    }

    if (locationTerm.trim()) {
      filtered = filtered.filter((job) =>
        job.location?.toLowerCase().includes(locationTerm.toLowerCase())
      );
    }

    if (selectedType) {
      filtered = filtered.filter((job) => job.type === selectedType);
    }

    if (selectedLevel) {
      filtered = filtered.filter((job) => job.level === selectedLevel);
    }

    if (selectedSource === "internal") {
      filtered = filtered.filter(
        (job) => job.jobSource === "internal" || !job.jobSource
      );
    }

    if (selectedSource === "external") {
      filtered = filtered.filter((job) => job.jobSource === "external");
    }

    if (sortBy === "Title") {
      filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    if (sortBy === "Company") {
      filtered.sort((a, b) =>
        (a.company || "").localeCompare(b.company || "")
      );
    }

    if (sortBy === "Newest") {
      filtered.sort(
        (a, b) => getJobDateValue(b.postedAt) - getJobDateValue(a.postedAt)
      );
    }

    return filtered;
  }, [
    jobs,
    searchTerm,
    companyTerm,
    locationTerm,
    selectedType,
    selectedLevel,
    selectedSource,
    sortBy,
  ]);

  const selectedJob = useMemo(() => {
    if (!filteredJobs.length) return null;

    const found = filteredJobs.find((job) => job.id === selectedJobId);
    return found || filteredJobs[0];
  }, [filteredJobs, selectedJobId]);

  const hasActiveFilters =
    searchTerm ||
    companyTerm ||
    locationTerm ||
    selectedType ||
    selectedLevel ||
    selectedSource ||
    sortBy !== "Newest";

  const clearAllFilters = () => {
    setSearchTerm("");
    setCompanyTerm("");
    setLocationTerm("");
    setSortBy("Newest");
    setSelectedType("");
    setSelectedLevel("");
    setSelectedSource("");
  };

  const handleApplyClick = (job) => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (isExternalJob(job)) {
      window.open(job.externalUrl, "_blank", "noopener,noreferrer");
      return;
    }

    navigate(`/job/${job.id}/apply`);
  };

  const getApplyUrl = (job) => {
    if (isExternalJob(job)) return job.externalUrl;
    return `${window.location.origin}/job/${job.id}/apply`;
  };

  const shareOnWhatsApp = (job) => {
    const message =
      `JOB ALERT: ${job.title || "Job Opportunity"} at ${
        job.company || "Company"
      }\n\n` +
      `Location: ${job.location || "Remote"}\n` +
      `${job.salary ? `Salary: ${job.salary}\n` : ""}` +
      `${job.type ? `Type: ${job.type}\n` : ""}` +
      `${job.level ? `Level: ${job.level}\n` : ""}` +
      `Apply here: ${getApplyUrl(job)}\n\n` +
      `Shared from AjiraBora`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const shareOnFacebook = (job) => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        getApplyUrl(job)
      )}`,
      "_blank",
      "width=600,height=500"
    );
  };

  const shareOnLinkedIn = (job) => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        getApplyUrl(job)
      )}`,
      "_blank",
      "width=600,height=500"
    );
  };

  return (
    <div className="min-h-screen bg-[#F3F2EF] text-gray-900 dark:bg-slate-950 dark:text-white">
      <Header />

      <main className="pt-20">
        <SearchSection
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          locationTerm={locationTerm}
          setLocationTerm={setLocationTerm}
        />

        <section className="mx-auto max-w-7xl px-4 py-6">
          <div className="mb-4 text-sm text-gray-500 dark:text-slate-400">
            Home <span className="mx-1">›</span>{" "}
            <span className="font-medium text-gray-700 dark:text-slate-300">
              Search Jobs
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr_340px]">
            <aside className="hidden space-y-4 lg:block">
              <SidebarCard title="Filters" icon={<BiFilterAlt />}>
                <div className="space-y-4">
                  <TextFilter
                    label="Company"
                    value={companyTerm}
                    onChange={setCompanyTerm}
                    placeholder="Search company"
                  />

                  <FilterSection
                    title="Job Type"
                    items={jobTypes}
                    selected={selectedType}
                    onSelect={(value) =>
                      setSelectedType(selectedType === value ? "" : value)
                    }
                  />

                  <FilterSection
                    title="Experience Level"
                    items={jobLevels}
                    selected={selectedLevel}
                    onSelect={(value) =>
                      setSelectedLevel(selectedLevel === value ? "" : value)
                    }
                  />

                  <FilterSection
                    title="Job Source"
                    items={jobSources}
                    selected={selectedSource}
                    onSelect={(value) =>
                      setSelectedSource(selectedSource === value ? "" : value)
                    }
                    isObject
                  />

                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="w-full rounded-full border border-gray-300 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </SidebarCard>

              <SidebarCard title="Companies" icon={<BiBuilding />}>
                <div className="space-y-1">
                  {companyOptions.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      No companies yet
                    </p>
                  ) : (
                    companyOptions.map((company) => (
                      <button
                        key={company.name}
                        onClick={() => setCompanyTerm(company.name)}
                        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <span>{company.name}</span>
                        <span className="text-xs text-gray-400 dark:text-slate-500">
                          {company.count}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </SidebarCard>

              <SidebarCard title="Locations" icon={<BiMapPin />}>
                <div className="space-y-1">
                  {locationOptions.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      No locations yet
                    </p>
                  ) : (
                    locationOptions.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => setLocationTerm(item.name)}
                        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <span>{item.name}</span>
                        <span className="text-xs text-gray-400 dark:text-slate-500">
                          {item.count} jobs
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </SidebarCard>
            </aside>

            <section className="space-y-3">
              <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {loading
                        ? "Loading jobs..."
                        : `${filteredJobs.length} jobs found`}
                    </h2>

                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Showing matching opportunities
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                      className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-[#FF8C00] dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                      <option value="Newest">Newest</option>
                      <option value="Title">Title A-Z</option>
                      <option value="Company">Company A-Z</option>
                    </select>

                    <button
                      onClick={() => setShowMobileFilters(true)}
                      className="flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1.5 text-xs text-gray-700 lg:hidden dark:border-slate-700 dark:text-slate-200"
                    >
                      <BiFilterAlt />
                      Filter
                    </button>
                  </div>
                </div>
              </div>

              {loading ? (
                <JobListSkeleton />
              ) : filteredJobs.length === 0 ? (
                <EmptyJobs clearFilters={clearAllFilters} />
              ) : (
                <div className="space-y-2">
                  {filteredJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      active={selectedJob?.id === job.id}
                      saved={savedJobIds.includes(job.id)}
                      saving={savingJobId === job.id}
                      onSelect={() => setSelectedJobId(job.id)}
                      onSave={() => toggleSavedJob(job.id)}
                      onApply={() => handleApplyClick(job)}
                      onShareWhatsApp={() => shareOnWhatsApp(job)}
                      onShareFacebook={() => shareOnFacebook(job)}
                      onShareLinkedIn={() => shareOnLinkedIn(job)}
                    />
                  ))}
                </div>
              )}
            </section>

            <aside className="hidden lg:block">
              <JobPreview
                job={selectedJob}
                saved={selectedJob ? savedJobIds.includes(selectedJob.id) : false}
                saving={selectedJob ? savingJobId === selectedJob.id : false}
                onSave={() => selectedJob && toggleSavedJob(selectedJob.id)}
                onApply={() => selectedJob && handleApplyClick(selectedJob)}
                onShareWhatsApp={() =>
                  selectedJob && shareOnWhatsApp(selectedJob)
                }
                onShareFacebook={() =>
                  selectedJob && shareOnFacebook(selectedJob)
                }
                onShareLinkedIn={() =>
                  selectedJob && shareOnLinkedIn(selectedJob)
                }
              />
            </aside>
          </div>
        </section>
      </main>

      {showMobileFilters && (
        <MobileFilters
          onClose={() => setShowMobileFilters(false)}
          companyTerm={companyTerm}
          setCompanyTerm={setCompanyTerm}
          jobTypes={jobTypes}
          jobLevels={jobLevels}
          jobSources={jobSources}
          selectedType={selectedType}
          selectedLevel={selectedLevel}
          selectedSource={selectedSource}
          setSelectedType={setSelectedType}
          setSelectedLevel={setSelectedLevel}
          setSelectedSource={setSelectedSource}
          clearAllFilters={clearAllFilters}
        />
      )}

      <Footer />
    </div>
  );
};

const SearchSection = ({
  searchTerm,
  setSearchTerm,
  locationTerm,
  setLocationTerm,
}) => {
  return (
    <section className="border-b border-gray-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-5 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Browse Jobs
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Find real opportunities from trusted employers
          </p>
        </div>

        <form
          className="mx-auto max-w-3xl"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400 dark:text-slate-500" />

              <input
                type="text"
                placeholder="Job title, skills, or company"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-gray-900 outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>

            <div className="relative flex-1">
              <BiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400 dark:text-slate-500" />

              <input
                type="text"
                placeholder="City or region"
                value={locationTerm}
                onChange={(event) => setLocationTerm(event.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-gray-900 outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>

            <button className="rounded-md bg-[#1A2A4A] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#243b66] dark:bg-[#FF8C00] dark:hover:bg-orange-600">
              Search
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

const SidebarCard = ({ title, icon, children }) => {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
        <span className="text-[#FF8C00]">{icon}</span>
        {title}
      </h3>

      {children}
    </section>
  );
};

const TextFilter = ({ label, value, onChange, placeholder }) => {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
        {label}
      </label>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
      />
    </div>
  );
};

const FilterSection = ({
  title,
  items,
  selected,
  onSelect,
  isObject = false,
}) => {
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
        {title}
      </h4>

      <div className="space-y-1">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">
            No options yet
          </p>
        ) : (
          items.map((item) => {
            const value = isObject ? item.value : item;
            const label = isObject ? item.label : item;

            return (
              <button
                key={value}
                onClick={() => onSelect(value)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  selected === value
                    ? "bg-orange-50 text-[#FF8C00] dark:bg-orange-500/10"
                    : "text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {label}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

const JobCard = ({
  job,
  active,
  saved,
  saving,
  onSelect,
  onSave,
  onApply,
  onShareWhatsApp,
  onShareFacebook,
  onShareLinkedIn,
}) => {
  const external = isExternalJob(job);

  return (
    <article
      onClick={onSelect}
      className={`cursor-pointer rounded-lg border bg-white p-3 transition hover:shadow-md dark:bg-slate-900 ${
        active
          ? "border-l-4 border-l-[#FF8C00] border-gray-200 shadow-md dark:border-slate-800 dark:border-l-[#FF8C00]"
          : "border-gray-200 dark:border-slate-800"
      }`}
    >
      <div className="flex gap-3">
        <CompanyLogo job={job} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-sm font-semibold text-[#1A2A4A] hover:text-[#FF8C00] hover:underline dark:text-white">
                {job.title || "Untitled Job"}
              </h3>

              <p className="text-xs font-medium text-gray-800 dark:text-slate-300">
                {job.company || "Company"}
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <BiMapPin />
                  {job.location || "Remote"}
                </span>

                <span className="flex items-center gap-1">
                  <BiTimeFive />
                  {formatTimePosted(job.postedAt)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSave();
              }}
              disabled={saving}
              className="rounded-full p-1.5 text-gray-400 transition hover:bg-orange-50 hover:text-[#FF8C00] disabled:opacity-60 dark:text-slate-500 dark:hover:bg-orange-500/10"
              title={saved ? "Remove from saved jobs" : "Save job"}
            >
              {saved ? (
                <FaBookmark className="text-[#FF8C00]" />
              ) : (
                <FaRegBookmark />
              )}
            </button>
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {external && (
              <Pill className="bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300">
                <FaExternalLinkAlt className="text-[10px]" />
                External
              </Pill>
            )}

            {!external && (
              <Pill className="bg-orange-50 text-[#FF8C00] dark:bg-orange-500/10">
                Easy Apply
              </Pill>
            )}

            {job.type && <Pill>{job.type}</Pill>}

            {job.level && (
              <Pill className="bg-blue-50 text-[#1A2A4A] dark:bg-blue-500/10 dark:text-blue-300">
                <BiTrendingUp />
                {job.level}
              </Pill>
            )}

            {job.salary && (
              <Pill className="bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300">
                <BiMoney />
                {job.salary}
              </Pill>
            )}

            {job.sourcePlatform && (
              <Pill>
                {getSourceIcon(job.sourcePlatform)}
                {capitalize(job.sourcePlatform)}
              </Pill>
            )}
          </div>

          <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-600 dark:text-slate-300">
            {job.description || "No description provided"}
          </p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onApply();
              }}
              className={`rounded-full px-3 py-1 text-xs font-semibold text-white transition ${
                external
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-[#FF8C00] hover:bg-orange-600"
              }`}
            >
              {external ? "Apply" : "Quick Apply"}
            </button>

            <div className="flex gap-1">
              <ShareIcon
                label="Share on WhatsApp"
                icon={<FaWhatsapp />}
                onClick={(event) => {
                  event.stopPropagation();
                  onShareWhatsApp();
                }}
                className="bg-green-500"
              />

              <ShareIcon
                label="Share on Facebook"
                icon={<FaFacebook />}
                onClick={(event) => {
                  event.stopPropagation();
                  onShareFacebook();
                }}
                className="bg-blue-700"
              />

              <ShareIcon
                label="Share on LinkedIn"
                icon={<FaLinkedin />}
                onClick={(event) => {
                  event.stopPropagation();
                  onShareLinkedIn();
                }}
                className="bg-[#1A2A4A] dark:bg-[#FF8C00]"
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

const JobPreview = ({
  job,
  saved,
  saving,
  onSave,
  onApply,
  onShareWhatsApp,
  onShareFacebook,
  onShareLinkedIn,
}) => {
  if (!job) {
    return (
      <div className="sticky top-24 rounded-lg border border-gray-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
        <BiBriefcase className="mx-auto mb-2 text-4xl text-gray-300 dark:text-slate-600" />
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Select a job to view details
        </p>
      </div>
    );
  }

  const external = isExternalJob(job);

  return (
    <aside className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-lg border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-gray-100 p-4 dark:border-slate-800">
        <div className="mb-3 flex gap-3">
          <CompanyLogo job={job} size="lg" />

          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {job.title || "Untitled Job"}
            </h2>

            <p className="text-sm text-gray-600 dark:text-slate-400">
              {job.company || "Company"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onApply}
            className={`flex-1 rounded-full py-1.5 text-sm font-semibold text-white transition ${
              external
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-[#FF8C00] hover:bg-orange-600"
            }`}
          >
            {external ? "Apply on Site" : "Easy Apply"}
          </button>

          <button
            onClick={onSave}
            disabled={saving}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition disabled:opacity-60 ${
              saved
                ? "border-[#FF8C00] bg-orange-50 text-[#FF8C00] dark:bg-orange-500/10"
                : "border-[#1A2A4A] text-[#1A2A4A] hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            {saved ? "Saved" : "Save"}
          </button>
        </div>

        <div className="mt-3 flex justify-center gap-2">
          <ShareIcon
            label="Share on WhatsApp"
            icon={<FaWhatsapp />}
            onClick={onShareWhatsApp}
            className="bg-green-500"
          />

          <ShareIcon
            label="Share on Facebook"
            icon={<FaFacebook />}
            onClick={onShareFacebook}
            className="bg-blue-700"
          />

          <ShareIcon
            label="Share on LinkedIn"
            icon={<FaLinkedin />}
            onClick={onShareLinkedIn}
            className="bg-[#1A2A4A] dark:bg-[#FF8C00]"
          />
        </div>
      </div>

      <div className="p-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <BiBriefcase className="text-[#FF8C00]" />
          Job Details
        </h3>

        <div className="space-y-2 text-xs">
          <DetailLine
            icon={<BiMapPin />}
            label="Location"
            value={job.location || "Remote"}
          />

          {job.salary && (
            <DetailLine icon={<BiMoney />} label="Salary" value={job.salary} />
          )}

          {job.type && (
            <DetailLine icon={<BiBriefcase />} label="Job Type" value={job.type} />
          )}

          {job.level && (
            <DetailLine
              icon={<BiTrendingUp />}
              label="Level"
              value={job.level}
            />
          )}

          <DetailLine
            icon={<BiTimeFive />}
            label="Posted"
            value={formatTimePosted(job.postedAt)}
          />

          {job.sourcePlatform && (
            <DetailLine
              icon={getSourceIcon(job.sourcePlatform)}
              label="Source"
              value={capitalize(job.sourcePlatform)}
            />
          )}
        </div>

        <h3 className="mb-2 mt-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <BiFile className="text-[#FF8C00]" />
          Description
        </h3>

        <p className="whitespace-pre-wrap text-xs leading-5 text-gray-600 dark:text-slate-300">
          {job.description || "No description provided"}
        </p>

        {job.requirements && (
          <>
            <h3 className="mb-2 mt-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <BiCheckCircle className="text-[#FF8C00]" />
              Requirements
            </h3>

            <p className="whitespace-pre-wrap text-xs leading-5 text-gray-600 dark:text-slate-300">
              {job.requirements}
            </p>
          </>
        )}
      </div>
    </aside>
  );
};

const Pill = ({
  children,
  className = "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300",
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
};

const DetailLine = ({ icon, label, value }) => {
  return (
    <p className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
      <span className="text-[#FF8C00]">{icon}</span>
      <strong>{label}:</strong>
      <span>{value}</span>
    </p>
  );
};

const ShareIcon = ({ icon, onClick, className, label }) => {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`flex h-6 w-6 items-center justify-center rounded-full text-sm text-white transition hover:scale-105 ${className}`}
    >
      {icon}
    </button>
  );
};

const CompanyLogo = ({ job, size = "md" }) => {
  const sizeClass = size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const iconClass = size === "lg" ? "text-xl" : "text-lg";

  if (job.logo) {
    return (
      <img
        src={job.logo}
        alt={job.company || "Company"}
        className={`${sizeClass} shrink-0 rounded-md border border-gray-200 bg-white object-contain p-1 dark:border-slate-700 dark:bg-slate-950`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-md bg-orange-50 text-[#FF8C00] dark:bg-orange-500/10`}
    >
      <BiBuilding className={iconClass} />
    </div>
  );
};

const JobListSkeleton = () => {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-lg border border-gray-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-md bg-gray-200 dark:bg-slate-800" />

            <div className="flex-1">
              <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-slate-800" />
              <div className="mt-2 h-3 w-1/2 rounded bg-gray-200 dark:bg-slate-800" />
              <div className="mt-2 h-3 w-full rounded bg-gray-200 dark:bg-slate-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const EmptyJobs = ({ clearFilters }) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
      <BiBriefcase className="mx-auto mb-2 text-4xl text-gray-300 dark:text-slate-600" />

      <h3 className="text-base font-bold text-gray-900 dark:text-white">
        No jobs found
      </h3>

      <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
        Try adjusting your search or filters
      </p>

      <button
        onClick={clearFilters}
        className="mt-3 rounded-full bg-[#1A2A4A] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#243b66] dark:bg-[#FF8C00] dark:hover:bg-orange-600"
      >
        Clear Filters
      </button>
    </div>
  );
};

const MobileFilters = ({
  onClose,
  companyTerm,
  setCompanyTerm,
  jobTypes,
  jobLevels,
  jobSources,
  selectedType,
  selectedLevel,
  selectedSource,
  setSelectedType,
  setSelectedLevel,
  setSelectedSource,
  clearAllFilters,
}) => {
  return (
    <div className="fixed inset-0 z-[999] bg-black/40 lg:hidden">
      <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-white shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-slate-800">
          <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
            <BiFilterAlt className="text-[#FF8C00]" />
            Filters
          </h3>

          <button
            onClick={onClose}
            className="rounded-full bg-gray-100 p-1 dark:bg-slate-800"
          >
            <BiX className="text-xl text-gray-700 dark:text-white" />
          </button>
        </div>

        <div className="p-4">
          <TextFilter
            label="Company"
            value={companyTerm}
            onChange={setCompanyTerm}
            placeholder="Search company"
          />

          <div className="mt-4">
            <FilterSection
              title="Job Type"
              items={jobTypes}
              selected={selectedType}
              onSelect={(value) =>
                setSelectedType(selectedType === value ? "" : value)
              }
            />
          </div>

          <div className="mt-4">
            <FilterSection
              title="Experience Level"
              items={jobLevels}
              selected={selectedLevel}
              onSelect={(value) =>
                setSelectedLevel(selectedLevel === value ? "" : value)
              }
            />
          </div>

          <div className="mt-4">
            <FilterSection
              title="Job Source"
              items={jobSources}
              selected={selectedSource}
              onSelect={(value) =>
                setSelectedSource(selectedSource === value ? "" : value)
              }
              isObject
            />
          </div>

          <button
            onClick={clearAllFilters}
            className="mb-2 mt-4 w-full rounded-full border border-gray-300 py-2 text-sm font-semibold text-gray-700 dark:border-slate-700 dark:text-slate-200"
          >
            Clear Filters
          </button>

          <button
            onClick={onClose}
            className="w-full rounded-full bg-[#1A2A4A] py-2 text-sm font-semibold text-white dark:bg-[#FF8C00]"
          >
            Show Results
          </button>
        </div>
      </div>
    </div>
  );
};

const isExternalJob = (job) => {
  return job.jobSource === "external" && Boolean(job.externalUrl);
};

const formatTimePosted = (postedAt) => {
  if (!postedAt) return "Recently";

  const date = postedAt?.toDate ? postedAt.toDate() : new Date(postedAt);

  if (Number.isNaN(date.getTime())) return "Recently";

  const diffHours = Math.floor((new Date() - date) / (1000 * 60 * 60));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;

  return `${Math.floor(diffHours / 24)}d ago`;
};

const getJobDateValue = (postedAt) => {
  if (!postedAt) return 0;

  const date = postedAt?.toDate ? postedAt.toDate() : new Date(postedAt);

  if (Number.isNaN(date.getTime())) return 0;

  return date.getTime();
};

const capitalize = (value) => {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const getSourceIcon = (source) => {
  switch (source) {
    case "linkedin":
      return <SiLinkedin className="text-[#0077B5] text-xs" />;
    case "indeed":
      return <SiIndeed className="text-[#2164F4] text-xs" />;
    case "brightermonday":
      return <FaGlobe className="text-green-600 text-xs" />;
    default:
      return <FaExternalLinkAlt className="text-purple-500 text-xs" />;
  }
};

export default JobsPage;