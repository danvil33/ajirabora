import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../Context/AuthContext";
import { getJobById } from "../services/jobService";
import { submitApplication, hasUserApplied } from "../services/applicationService";
import { getUserProfile, isProfileComplete } from "../services/userService";

import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";
import AjiraBoraAI from "../Components/AjiraBoraAI";

import {
  BiArrowBack,
  BiBook,
  BiBookOpen,
  BiBriefcase,
  BiBriefcaseAlt,
  BiBuilding,
  BiCalendar,
  BiCheckCircle,
  BiDownload,
  BiEnvelope,
  BiErrorCircle,
  BiFile,
  BiLinkExternal,
  BiLoader,
  BiMapPin,
  BiMoney,
  BiPhone,
  BiTimeFive,
  BiUser,
  BiUserCircle,
} from "react-icons/bi";

import {
  FaExternalLinkAlt,
  FaFacebook,
  FaFileAlt,
  FaFilePdf,
  FaFileWord,
  FaGlobe,
  FaLinkedin,
  FaTwitter,
  FaWhatsapp,
} from "react-icons/fa";

import { SiIndeed, SiLinkedin } from "react-icons/si";

const JobApplyPage = () => {
  const { jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [profileData, setProfileData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);

  const [coverLetter, setCoverLetter] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchData();
  }, [jobId, user]);

  const fetchData = async () => {
    try {
      const jobData = await getJobById(jobId);

      if (!jobData) {
        navigate("/jobs");
        return;
      }

      setJob(jobData);

      if (jobData.jobSource === "external" && jobData.externalUrl) {
        setRedirecting(true);

        setTimeout(() => {
          window.open(jobData.externalUrl, "_blank", "noopener,noreferrer");
          navigate("/jobs");
        }, 2500);

        return;
      }

      if (user) {
        const applied = await hasUserApplied(user.uid, jobId);
        setAlreadyApplied(applied);

        const profile = await getUserProfile(user.uid);
        setProfileData(profile);
        setProfileComplete(isProfileComplete(profile));
      }
    } catch (err) {
      console.error("Error fetching job apply data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();

    if (!coverLetter.trim()) {
      setError("Please write a cover letter.");
      return;
    }

    setApplying(true);
    setError("");

    try {
      const applicationData = {
        jobId: job.id,
        jobTitle: job.title,
        jobCompany: job.company,
        jobLocation: job.location,
        userId: user.uid,
        applicantName: profileData?.name || user.displayName || "",
        applicantEmail: user.email,
        applicantPhone: profileData?.phone || "",
        applicantLocation: profileData?.location || "",
        applicantEducation: profileData?.education || "",
        applicantExperience: profileData?.experience || "",
        coverLetter,
        resumeUrl: profileData?.resumeUrl || "",
        appliedAt: new Date().toISOString(),
      };

      await submitApplication(applicationData);

      setSuccess("Application submitted successfully!");
      setAlreadyApplied(true);
      setCoverLetter("");

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to submit application.");
    } finally {
      setApplying(false);
    }
  };

  const getApplyUrl = () => {
    if (job?.jobSource === "external" && job?.externalUrl) {
      return job.externalUrl;
    }

    return `${window.location.origin}/job/${job?.id}/apply`;
  };

  const getShareText = () => {
    return (
      `🚨 JOB ALERT: ${job?.title || "Job Opportunity"} at ${
        job?.company || "Company"
      }\n\n` +
      `📍 Location: ${job?.location || "Remote"}\n` +
      `${job?.salary ? `💰 Salary: ${job.salary}\n` : ""}` +
      `${job?.type ? `📋 Type: ${job.type}\n` : ""}` +
      `${job?.level ? `📊 Level: ${job.level}\n` : ""}` +
      `🔗 Apply here: ${getApplyUrl()}\n\n` +
      `Shared from AjiraBora`
    );
  };

  const shareOnWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(getShareText())}`,
      "_blank"
    );
  };

  const shareOnFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        getApplyUrl()
      )}`,
      "_blank",
      "width=600,height=500"
    );
  };

  const shareOnX = () => {
    const text = `Job Alert: ${job?.title || "Job Opportunity"} at ${
      job?.company || "Company"
    } - ${job?.location || "Remote"}`;

    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(
        text
      )}&url=${encodeURIComponent(getApplyUrl())}`,
      "_blank",
      "width=600,height=500"
    );
  };

  const shareOnLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        getApplyUrl()
      )}`,
      "_blank",
      "width=600,height=500"
    );
  };

  if (redirecting) {
    return (
      <PageShell>
        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="max-w-md rounded-md border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300">
              <FaExternalLinkAlt className="text-2xl" />
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
              Redirecting to External Site
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              This job is hosted on{" "}
              <strong>{job?.sourcePlatform || "another platform"}</strong>.
              You will be redirected to apply.
            </p>

            <div className="mx-auto mt-5 h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />

            <button
              onClick={() => {
                window.open(job?.externalUrl, "_blank", "noopener,noreferrer");
                navigate("/jobs");
              }}
              className="mt-6 text-sm font-semibold text-[#FF8C00] hover:underline"
            >
              Click here if not redirected automatically
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  if (loading) {
    return (
      <PageShell>
        <div className="flex h-[70vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#FF8C00] border-t-transparent" />
        </div>
      </PageShell>
    );
  }

  if (!job) {
    return (
      <PageShell>
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Job not found
          </h2>

          <Link
            to="/jobs"
            className="mt-4 inline-block text-sm font-semibold text-[#FF8C00] hover:underline"
          >
            Back to Jobs
          </Link>
        </div>
      </PageShell>
    );
  }

  const isExternal = job.jobSource === "external";

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Home <span className="mx-1">›</span> Jobs{" "}
          <span className="mx-1">›</span>{" "}
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {job.title || "Job Details"}
          </span>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#FF8C00] dark:text-slate-300"
        >
          <BiArrowBack />
          Back to Jobs
        </button>

        <section className="mb-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <CompanyLogo job={job} />

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {job.title || "Untitled Job"}
                  </h1>

                  <p className="mt-1 text-base font-semibold text-slate-600 dark:text-slate-400">
                    {job.company || "Company"}
                  </p>
                </div>

                {isExternal ? (
                  <span className="inline-flex w-fit items-center gap-1 rounded bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 dark:bg-purple-500/10 dark:text-purple-300">
                    <FaExternalLinkAlt className="text-[10px]" />
                    External
                  </span>
                ) : (
                  <span className="inline-flex w-fit items-center gap-1 rounded bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 dark:bg-green-500/10 dark:text-green-300">
                    Easy Apply
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
                <InfoInline icon={<BiBriefcase />} text={job.level || "Not specified"} />
                <InfoInline icon={<BiMapPin />} text={job.location || "Remote"} />
                {job.salary && <InfoInline icon={<BiMoney />} text={job.salary} />}
                <InfoInline icon={<BiTimeFive />} text={formatDate(job.postedAt)} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {job.type && <SmallTag>{job.type}</SmallTag>}

                {isExternal && job.sourcePlatform && (
                  <SmallTag>
                    <span className="inline-flex items-center gap-1">
                      {getSourceIcon(job.sourcePlatform)}
                      Apply via {capitalize(job.sourcePlatform)}
                    </span>
                  </SmallTag>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
          <section className="space-y-4">
            <ContentCard title="Job Description" icon={<BiFile />}>
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">
                {job.description || "No description provided"}
              </p>
            </ContentCard>

            {!isExternal && job.requirements && (
              <ContentCard title="Requirements & Qualifications" icon={<BiBook />}>
                <div className="space-y-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
                  {job.requirements.split("\n").map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              </ContentCard>
            )}

            <ContentCard title="Job Information" icon={<BiBriefcase />}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoBox label="Location" value={job.location || "Remote"} icon={<BiMapPin />} />

                {job.salary && (
                  <InfoBox label="Salary" value={job.salary} icon={<BiMoney />} />
                )}

                <InfoBox label="Posted Date" value={formatDate(job.postedAt)} icon={<BiCalendar />} />

                <InfoBox label="Job Type" value={job.type || "Full-time"} icon={<BiTimeFive />} />
              </div>
            </ContentCard>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <SharePanel
              onWhatsApp={shareOnWhatsApp}
              onFacebook={shareOnFacebook}
              onX={shareOnX}
              onLinkedIn={shareOnLinkedIn}
            />

            {!isExternal && user && !alreadyApplied && profileComplete && (
              <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <AjiraBoraAI jobId={job?.id} jobTitle={job?.title} />
              </div>
            )}

            <ApplicationPanel
              job={job}
              isExternal={isExternal}
              user={user}
              profileData={profileData}
              profileComplete={profileComplete}
              alreadyApplied={alreadyApplied}
              coverLetter={coverLetter}
              setCoverLetter={setCoverLetter}
              applying={applying}
              error={error}
              success={success}
              onSubmit={handleSubmitApplication}
            />
          </aside>
        </div>
      </main>
    </PageShell>
  );
};

const PageShell = ({ children }) => {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#f4f5f7] pt-20 dark:bg-slate-950">
        {children}
      </div>
      <Footer />
    </>
  );
};

const CompanyLogo = ({ job }) => {
  if (job.logo) {
    return (
      <img
        src={job.logo}
        alt={job.company || "Company"}
        className="h-16 w-16 shrink-0 rounded-md border border-slate-200 bg-white object-contain p-2 dark:border-slate-800"
      />
    );
  }

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-3xl text-slate-400 dark:border-slate-800 dark:bg-slate-950">
      <BiBuilding />
    </div>
  );
};

const ContentCard = ({ title, icon, children }) => {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
        <span className="text-[#FF8C00]">{icon}</span>
        {title}
      </h2>

      {children}
    </section>
  );
};

const InfoInline = ({ icon, text }) => {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-slate-400">{icon}</span>
      {text}
    </span>
  );
};

const InfoBox = ({ label, value, icon }) => {
  return (
    <div className="flex items-center gap-3 rounded-md border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
      <span className="text-xl text-[#FF8C00]">{icon}</span>

      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
};

const SharePanel = ({ onWhatsApp, onFacebook, onX, onLinkedIn }) => {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
        Share this Job
      </p>

      <div className="grid grid-cols-4 gap-2">
        <ShareButton
          title="Share on WhatsApp"
          onClick={onWhatsApp}
          className="bg-green-500 hover:bg-green-600"
        >
          <FaWhatsapp />
        </ShareButton>

        <ShareButton
          title="Share on Facebook"
          onClick={onFacebook}
          className="bg-blue-700 hover:bg-blue-800"
        >
          <FaFacebook />
        </ShareButton>

        <ShareButton
          title="Share on X"
          onClick={onX}
          className="bg-black hover:bg-slate-800"
        >
          <FaTwitter />
        </ShareButton>

        <ShareButton
          title="Share on LinkedIn"
          onClick={onLinkedIn}
          className="bg-blue-800 hover:bg-blue-900"
        >
          <FaLinkedin />
        </ShareButton>
      </div>
    </div>
  );
};

const ShareButton = ({ children, title, onClick, className }) => {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-10 items-center justify-center rounded-md text-lg text-white transition ${className}`}
    >
      {children}
    </button>
  );
};

const ApplicationPanel = ({
  job,
  isExternal,
  user,
  profileData,
  profileComplete,
  alreadyApplied,
  coverLetter,
  setCoverLetter,
  applying,
  error,
  success,
  onSubmit,
}) => {
  if (isExternal) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300">
          <FaExternalLinkAlt className="text-xl" />
        </div>

        <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
          External Application
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          This job is hosted on{" "}
          <strong>{job.sourcePlatform || "another platform"}</strong>. Apply on
          their website.
        </p>

        <a
          href={job.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-purple-700"
        >
          <FaExternalLinkAlt />
          Apply on {job.sourcePlatform ? capitalize(job.sourcePlatform) : "External Site"}
        </a>
      </div>
    );
  }

  if (alreadyApplied) {
    return (
      <StatusPanel
        icon={<BiCheckCircle />}
        iconClass="bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-300"
        title="Application Submitted"
        description="You have already applied for this position."
        action={
          <Link
            to="/applications"
            className="mt-4 inline-block text-sm font-semibold text-[#FF8C00] hover:underline"
          >
            View My Applications →
          </Link>
        }
      />
    );
  }

  if (!user) {
    return (
      <StatusPanel
        icon={<BiUser />}
        iconClass="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
        title="Login to Apply"
        description="Please login to submit your application."
        action={
          <Link
            to="/login"
            className="mt-4 block rounded-md bg-[#1A2A4A] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#243b66]"
          >
            Login Now
          </Link>
        }
      />
    );
  }

  if (!profileComplete) {
    return (
      <StatusPanel
        icon={<BiErrorCircle />}
        iconClass="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
        title="Complete Your Profile"
        description="Please complete your profile before applying."
        action={
          <Link
            to="/profile"
            className="mt-4 block rounded-md bg-[#1A2A4A] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#243b66]"
          >
            Complete Profile
          </Link>
        }
      />
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-md border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
        Submit Application
      </h3>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-600 dark:border-green-800 dark:bg-green-500/10 dark:text-green-300">
          {success}
        </div>
      )}

      <ApplicantInfo profileData={profileData} user={user} />

      <ResumeBox profileData={profileData} />

      <div className="mt-4">
        <label className="mb-2 block text-sm font-bold text-slate-800 dark:text-white">
          Cover Letter <span className="text-red-500">*</span>
        </label>

        <textarea
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          rows={8}
          required
          placeholder="Write your cover letter here..."
          className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#FF8C00] dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Explain why you are a good fit for this position.
        </p>
      </div>

      <button
        type="submit"
        disabled={applying}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-[#1A2A4A] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#243b66] disabled:opacity-60"
      >
        {applying ? (
          <>
            <BiLoader className="animate-spin" />
            Submitting Application...
          </>
        ) : (
          "Submit Application"
        )}
      </button>
    </form>
  );
};

const StatusPanel = ({ icon, iconClass, title, description, action }) => {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div
        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-3xl ${iconClass}`}
      >
        {icon}
      </div>

      <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>

      {action}
    </div>
  );
};

const ApplicantInfo = ({ profileData, user }) => {
  return (
    <div className="mt-4 rounded-md border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
        <BiUserCircle className="text-[#FF8C00]" />
        Your Information
      </h4>

      <div className="space-y-2 text-sm">
        <ProfileLine icon={<BiUser />} label="Name" value={profileData?.name || user.displayName} />
        <ProfileLine icon={<BiEnvelope />} label="Email" value={user.email} />

        {profileData?.phone && (
          <ProfileLine icon={<BiPhone />} label="Phone" value={profileData.phone} />
        )}

        {profileData?.location && (
          <ProfileLine icon={<BiMapPin />} label="Location" value={profileData.location} />
        )}

        {profileData?.education && (
          <ProfileLine icon={<BiBookOpen />} label="Education" value={profileData.education} />
        )}

        {profileData?.experience && (
          <ProfileLine
            icon={<BiBriefcaseAlt />}
            label="Experience"
            value={profileData.experience}
          />
        )}
      </div>
    </div>
  );
};

const ProfileLine = ({ icon, label, value }) => {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <span className="shrink-0 text-slate-500 dark:text-slate-400">
        {label}:
      </span>
      <span className="font-medium text-slate-900 dark:text-white">{value}</span>
    </div>
  );
};

const ResumeBox = ({ profileData }) => {
  return (
    <div className="mt-4 rounded-md border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
        <BiFile className="text-[#FF8C00]" />
        Your Resume / CV
      </h4>

      {profileData?.resumeUrl ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            href={profileData.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1A2A4A] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#243b66]"
          >
            {getFileIcon(profileData.resumeUrl)}
            View Resume
            <BiLinkExternal />
          </a>

          <a
            href={profileData.resumeUrl}
            download
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            <BiDownload />
            Download
          </a>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm text-amber-600 dark:text-amber-300">
            No resume found in your profile.
          </p>

          <Link
            to="/profile"
            className="mt-2 inline-block text-sm font-semibold text-[#FF8C00] hover:underline"
          >
            Add Resume to Profile →
          </Link>
        </div>
      )}
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

const formatDate = (dateString) => {
  if (!dateString) return "Recently";

  const date = dateString?.toDate ? dateString.toDate() : new Date(dateString);

  if (Number.isNaN(date.getTime())) return "Recently";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getFileIcon = (url) => {
  if (!url) return <FaFileAlt className="text-slate-400" />;
  if (url.includes(".pdf")) return <FaFilePdf className="text-red-500" />;
  if (url.includes(".doc") || url.includes(".docx")) {
    return <FaFileWord className="text-blue-500" />;
  }

  return <FaFileAlt className="text-slate-400" />;
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

const capitalize = (value) => {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export default JobApplyPage;