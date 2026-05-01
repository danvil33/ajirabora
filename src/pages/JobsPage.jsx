import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getJobs } from "../services/jobService";
import { useAuth } from "../Context/AuthContext";
import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";

import {
  BiBriefcase,
  BiBuilding,
  BiCheckCircle,
  BiChevronDown,
  BiChevronRight,
  BiFilterAlt,
  BiMapPin,
  BiMoney,
  BiSearch,
  BiTimeFive,
  BiX,
} from "react-icons/bi";

import {
  FaExternalLinkAlt,
  FaGlobe,
  FaWhatsapp,
  FaFacebook,
  FaLinkedin,
  FaTwitter,
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
  const [sortBy, setSortBy] = useState("Relevance");

  const [selectedType, setSelectedType] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedSource, setSelectedSource] = useState("");

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const fetchedJobs = await getJobs();
      setJobs(fetchedJobs || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
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

  const hasActiveFilters =
    searchTerm ||
    companyTerm ||
    locationTerm ||
    selectedType ||
    selectedLevel ||
    selectedSource ||
    sortBy !== "Relevance";

  const clearAllFilters = () => {
    setSearchTerm("");
    setCompanyTerm("");
    setLocationTerm("");
    setSortBy("Relevance");
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
    const applyUrl = getApplyUrl(job);

    const message =
      `🚨 *JOB ALERT: ${job.title || "Job Opportunity"} at ${
        job.company || "Company"
      }*\n\n` +
      `📍 *Location:* ${job.location || "Remote"}\n` +
      `${job.salary ? `💰 *Salary:* ${job.salary}\n` : ""}` +
      `📋 *Type:* ${job.type || "Not specified"}\n` +
      `📊 *Level:* ${job.level || "Not specified"}\n` +
      `${isExternalJob(job) ? `🌐 *Source:* ${job.sourcePlatform || "External"}\n` : ""}\n` +
      `🔗 *Apply here:* ${applyUrl}\n\n` +
      `Shared from AjiraBora`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const shareOnFacebook = (job) => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      getApplyUrl(job)
    )}`;

    window.open(shareUrl, "_blank", "width=600,height=500");
  };

  const shareOnX = (job) => {
    const applyUrl = getApplyUrl(job);

    const text = `Job Alert: ${job.title || "Job Opportunity"} at ${
      job.company || "Company"
    } - ${job.location || "Remote"}`;

    const shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(applyUrl)}`;

    window.open(shareUrl, "_blank", "width=600,height=500");
  };

  const shareOnLinkedIn = (job) => {
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      getApplyUrl(job)
    )}`;

    window.open(shareUrl, "_blank", "width=600,height=500");
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] dark:bg-slate-950">
      <Header />

      <main className="pt-20">
        <TopSearch
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          locationTerm={locationTerm}
          setLocationTerm={setLocationTerm}
          onOpenFilters={() => setShowMobileFilters(true)}
        />

        <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Home <span className="mx-1">›</span>{" "}
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Search Jobs
            </span>
          </div>

          <div className="mb-4 rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Browse Jobs
                </h1>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {loading
                    ? "Loading jobs..."
                    : `Showing ${filteredJobs.length} job vacancies`}
                </p>
              </div>

              <button
                onClick={() => setShowMobileFilters(true)}
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 lg:hidden dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                <BiFilterAlt />
                Filters
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
            <aside className="hidden lg:block">
              <FilterSidebar
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
                hasActiveFilters={hasActiveFilters}
              />
            </aside>

            <section>
              <div className="mb-3 flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} found
                </p>

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Sort by:</span>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                  >
                    <option value="Relevance">Relevance</option>
                    <option value="Newest">Newest</option>
                    <option value="Title">Title A-Z</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <JobListSkeleton />
              ) : filteredJobs.length === 0 ? (
                <EmptyJobs clearAllFilters={clearAllFilters} />
              ) : (
                <div className="space-y-3">
                  {filteredJobs.map((job) => (
                    <JobListCard
                      key={job.id}
                      job={job}
                      onApply={() => handleApplyClick(job)}
                      onShareWhatsApp={() => shareOnWhatsApp(job)}
                      onShareFacebook={() => shareOnFacebook(job)}
                      onShareX={() => shareOnX(job)}
                      onShareLinkedIn={() => shareOnLinkedIn(job)}
                    />
                  ))}
                </div>
              )}
            </section>
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
          hasActiveFilters={hasActiveFilters}
        />
      )}

      <Footer />
    </div>
  );
};

const TopSearch = ({
  searchTerm,
  setSearchTerm,
  locationTerm,
  setLocationTerm,
  onOpenFilters,
}) => {
  return (
    <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
            <div className="flex items-center gap-3 rounded-md border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950">
              <BiSearch className="text-xl text-slate-400" />

              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by job title, skills or company"
                className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-3 rounded-md border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950">
              <BiMapPin className="text-xl text-slate-400" />

              <input
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
                placeholder="Location"
                className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
              />
            </div>

            <button className="rounded-md bg-[#FF8C00] px-7 py-3 text-sm font-bold text-white transition hover:bg-orange-600">
              Search
            </button>
          </div>

          <button
            onClick={onOpenFilters}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 lg:hidden dark:border-slate-700 dark:text-slate-200"
          >
            <BiFilterAlt />
            Filter Jobs
          </button>
        </div>
      </div>
    </section>
  );
};

const FilterSidebar = ({
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
  hasActiveFilters,
}) => {
  return (
    <div className="sticky top-24 space-y-3">
      <div className="rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <BiFilterAlt className="text-[#FF8C00]" />
            Filter Jobs
          </h3>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs font-semibold text-[#FF8C00] hover:underline"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800">
          <label className="mb-2 block text-sm font-bold text-slate-800 dark:text-white">
            Company
          </label>

          <input
            value={companyTerm}
            onChange={(e) => setCompanyTerm(e.target.value)}
            placeholder="Search company"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#FF8C00] dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>

        <FilterGroup title="Job Type">
          {jobTypes.length === 0 ? (
            <p className="text-sm text-slate-400">No types yet</p>
          ) : (
            jobTypes.map((type) => (
              <FilterCheck
                key={type}
                label={type}
                active={selectedType === type}
                onClick={() =>
                  setSelectedType(selectedType === type ? "" : type)
                }
              />
            ))
          )}
        </FilterGroup>

        <FilterGroup title="Experience Level">
          {jobLevels.length === 0 ? (
            <p className="text-sm text-slate-400">No levels yet</p>
          ) : (
            jobLevels.map((level) => (
              <FilterCheck
                key={level}
                label={level}
                active={selectedLevel === level}
                onClick={() =>
                  setSelectedLevel(selectedLevel === level ? "" : level)
                }
              />
            ))
          )}
        </FilterGroup>

        <FilterGroup title="Job Source">
          {jobSources.map((source) => (
            <FilterCheck
              key={source.value}
              label={source.label}
              active={selectedSource === source.value}
              onClick={() =>
                setSelectedSource(
                  selectedSource === source.value ? "" : source.value
                )
              }
            />
          ))}
        </FilterGroup>
      </div>
    </div>
  );
};

const FilterGroup = ({ title, children }) => {
  return (
    <div className="border-b border-slate-100 px-4 py-4 last:border-b-0 dark:border-slate-800">
      <button className="mb-3 flex w-full items-center justify-between text-left">
        <span className="text-sm font-bold text-slate-800 dark:text-white">
          {title}
        </span>

        <BiChevronDown className="text-slate-400" />
      </button>

      <div className="space-y-2">{children}</div>
    </div>
  );
};

const FilterCheck = ({ label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 text-left text-sm text-slate-600 dark:text-slate-300"
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
          active ? "border-[#FF8C00] bg-[#FF8C00]" : "border-slate-300"
        }`}
      >
        {active && <BiCheckCircle className="text-xs text-white" />}
      </span>

      <span>{label}</span>
    </button>
  );
};

const JobListCard = ({
  job,
  onApply,
  onShareWhatsApp,
  onShareFacebook,
  onShareX,
  onShareLinkedIn,
}) => {
  const external = isExternalJob(job);

  return (
    <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <CompanyLogo job={job} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="line-clamp-2 text-base font-bold text-slate-900 hover:text-[#FF8C00] dark:text-white">
                {job.title || "Untitled Job"}
              </h2>

              <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-400">
                {job.company || "Company"}
              </p>
            </div>

            {external ? (
              <span className="inline-flex w-fit items-center gap-1 rounded bg-purple-50 px-2 py-1 text-xs font-bold text-purple-700 dark:bg-purple-500/10 dark:text-purple-300">
                <FaExternalLinkAlt className="text-[10px]" />
                External
              </span>
            ) : (
              <span className="inline-flex w-fit items-center gap-1 rounded bg-green-50 px-2 py-1 text-xs font-bold text-green-700 dark:bg-green-500/10 dark:text-green-300">
                Easy Apply
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1">
              <BiBriefcase className="text-slate-400" />
              {job.level || "Not specified"}
            </span>

            <span className="inline-flex items-center gap-1">
              <BiMapPin className="text-slate-400" />
              {job.location || "Remote"}
            </span>

            {job.salary && (
              <span className="inline-flex items-center gap-1">
                <BiMoney className="text-slate-400" />
                {job.salary}
              </span>
            )}
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {job.description || "No description provided"}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {job.type && <SmallTag>{job.type}</SmallTag>}

            {job.sourcePlatform && (
              <SmallTag>
                <span className="inline-flex items-center gap-1">
                  {getSourceIcon(job.sourcePlatform)}
                  {capitalize(job.sourcePlatform)}
                </span>
              </SmallTag>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              <BiTimeFive />
              {external ? "External Job" : "Employer Active"}{" "}
              {formatTimePosted(job.postedAt)}
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <ShareButton
                title="Share on WhatsApp"
                className="bg-green-500 hover:bg-green-600"
                onClick={onShareWhatsApp}
              >
                <FaWhatsapp />
              </ShareButton>

              <ShareButton
                title="Share on Facebook"
                className="bg-blue-700 hover:bg-blue-800"
                onClick={onShareFacebook}
              >
                <FaFacebook />
              </ShareButton>

              <ShareButton
                title="Share on X"
                className="bg-black hover:bg-slate-800"
                onClick={onShareX}
              >
                <FaTwitter />
              </ShareButton>

              <ShareButton
                title="Share on LinkedIn"
                className="bg-blue-800 hover:bg-blue-900"
                onClick={onShareLinkedIn}
              >
                <FaLinkedin />
              </ShareButton>

              <button
                onClick={onApply}
                className={`inline-flex items-center justify-center gap-1 rounded-md px-4 py-2 text-sm font-bold text-white transition ${
                  external
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-[#FF8C00] hover:bg-orange-600"
                }`}
              >
                {external ? "Visit & Apply" : "Apply"}
                <BiChevronRight className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

const ShareButton = ({ children, title, className, onClick }) => {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-white transition ${className}`}
    >
      {children}
    </button>
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
  hasActiveFilters,
}) => {
  return (
    <div className="fixed inset-0 z-[999] bg-black/40 lg:hidden">
      <div className="absolute right-0 top-0 h-full w-[86%] max-w-sm overflow-y-auto bg-white shadow-xl dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 dark:border-slate-800">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <BiFilterAlt className="text-[#FF8C00]" />
            Filter Jobs
          </h3>

          <button
            onClick={onClose}
            className="rounded-md bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <BiX className="text-xl" />
          </button>
        </div>

        <div className="p-4">
          <FilterSidebar
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
            hasActiveFilters={hasActiveFilters}
          />

          <button
            onClick={onClose}
            className="mt-4 w-full rounded-md bg-[#FF8C00] px-4 py-3 text-sm font-bold text-white"
          >
            Show Jobs
          </button>
        </div>
      </div>
    </div>
  );
};

const CompanyLogo = ({ job }) => {
  if (job.logo) {
    return (
      <img
        src={job.logo}
        alt={job.company || "Company"}
        className="h-12 w-12 shrink-0 rounded-md border border-slate-200 bg-white object-contain p-1"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-2xl text-slate-400 dark:border-slate-800 dark:bg-slate-950">
      <BiBuilding />
    </div>
  );
};

const SmallTag = ({ children }) => {
  return (
    <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      {children}
    </span>
  );
};

const EmptyJobs = ({ clearAllFilters }) => {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <BiBriefcase className="mx-auto text-5xl text-slate-300" />

      <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
        No jobs found
      </h3>

      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Try changing your search or filters.
      </p>

      <button
        onClick={clearAllFilters}
        className="mt-4 rounded-md bg-[#FF8C00] px-4 py-2 text-sm font-bold text-white hover:bg-orange-600"
      >
        Clear Filters
      </button>
    </div>
  );
};

const JobListSkeleton = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="rounded-md border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="animate-pulse">
            <div className="flex gap-3">
              <div className="h-12 w-12 rounded-md bg-slate-200 dark:bg-slate-800" />

              <div className="flex-1">
                <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="mt-2 h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="mt-4 h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
                <div className="mt-2 h-3 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          </div>
        </div>
      ))}
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