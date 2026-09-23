import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  selectPortfolioState,
  type ConfirmedImage,
} from "@/lib/confirmedProjects";
import "./Projects.css";

const labels = {
  th: {
    heading: "งานติดตั้งจริง",
    accent: "เห็นครบจากหน้างาน",
    intro:
      "จากหลังคาโรงแรมถึงบ้านพักอาศัย รวมภาพแผงโซลาร์ อุปกรณ์ และพื้นที่ติดตั้งในแต่ละโครงการของเรา",
    project: "โครงการ",
    photos: "ภาพ",
    videos: "วิดีโอ",
    choose: "เลือกชมผลงาน",
    all: "ทั้งหมด",
    open: "ขยายภาพ",
    close: "ปิดภาพ",
    previous: "ภาพก่อนหน้า",
    next: "ภาพถัดไป",
    video: "ภาพเคลื่อนไหวจากหน้างาน",
    seconds: "วินาที",
    inverter: "อินเวอร์เตอร์",
    cta: "พื้นที่ของคุณเหมาะกับโซลาร์แบบไหน?",
    ctaBody:
      "ส่งรายละเอียดอาคารและบิลค่าไฟให้ทีมงานช่วยดู ก่อนวางแผนระบบที่เหมาะกับการใช้งาน",
    contact: "คุยกับทีม SIRINX",
    assessment: "ประเมินโซลาร์เบื้องต้น",
    loading: "กำลังโหลดผลงาน",
    error: "ขณะนี้ยังโหลดผลงานไม่ได้",
    retry: "ลองอีกครั้ง",
    empty: "ยังไม่มีผลงานที่เผยแพร่ในขณะนี้",
  },
  en: {
    heading: "Real installations",
    accent: "A closer look on site",
    intro:
      "Solar panels, equipment and installation areas, photographed at our hotel and residential projects.",
    project: "projects",
    photos: "photos",
    videos: "video",
    choose: "Explore projects",
    all: "All",
    open: "Enlarge photo",
    close: "Close photo",
    previous: "Previous photo",
    next: "Next photo",
    video: "Video from the site",
    seconds: "seconds",
    inverter: "Inverter",
    cta: "What solar system suits your property?",
    ctaBody:
      "Share your building details and electricity bill with our team to explore a system suited to your usage.",
    contact: "Talk to SIRINX",
    assessment: "Explore solar assessment",
    loading: "Loading projects",
    error: "Projects could not be loaded right now",
    retry: "Try again",
    empty: "No projects are published at the moment",
  },
  cn: {
    heading: "真实安装案例",
    accent: "走近项目现场",
    intro: "展示酒店和住宅项目现场的太阳能板、设备及安装区域。",
    project: "个项目",
    photos: "张照片",
    videos: "段视频",
    choose: "查看项目",
    all: "全部",
    open: "放大照片",
    close: "关闭照片",
    previous: "上一张",
    next: "下一张",
    video: "项目现场视频",
    seconds: "秒",
    inverter: "逆变器",
    cta: "哪种太阳能系统适合您的物业？",
    ctaBody: "向团队提供建筑信息和电费账单，了解适合实际用电需求的方案。",
    contact: "联系 SIRINX",
    assessment: "初步太阳能评估",
    loading: "正在加载项目",
    error: "暂时无法加载项目",
    retry: "重试",
    empty: "目前没有已发布的项目",
  },
};

function ProjectPhoto({
  image,
  priority = false,
}: {
  image: ConfirmedImage;
  priority?: boolean;
}) {
  return (
    <picture>
      <source
        type="image/webp"
        srcSet={image.srcSet}
        sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 33vw"
      />
      <img
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
      />
    </picture>
  );
}

export default function Projects() {
  const { lang } = useLanguage();
  const text = labels[lang];
  const source =
    import.meta.env.VITE_PORTFOLIO_SOURCE === "backend" ? "backend" : "static";
  const projectQuery = trpc.project.list.useQuery(undefined, {
    enabled: source === "backend",
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const portfolio = useMemo(
    () =>
      selectPortfolioState({
        source,
        queryStatus: projectQuery.status,
        rows: projectQuery.data,
      }),
    [source, projectQuery.status, projectQuery.data],
  );
  const projects = portfolio.projects;
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<{
    images: ConfirmedImage[];
    index: number;
  } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const lightboxOpen = selected !== null;
  const activeImage = selected?.images[selected.index];
  const effectiveFilter =
    filter === "all" || projects.some((project) => project.id === filter)
      ? filter
      : "all";
  const visibleProjects = projects.filter(
    (project) => effectiveFilter === "all" || project.id === effectiveFilter,
  );
  const visiblePhotoCount = visibleProjects.reduce(
    (sum, project) => sum + project.images.length,
    0,
  );
  const allPhotoCount = projects.reduce(
    (sum, project) => sum + project.images.length,
    0,
  );
  const allVideoCount = projects.reduce(
    (sum, project) => sum + project.videos.length,
    0,
  );
  const featured =
    projects.find((project) => project.id === "ruean-phae-royal-park") ??
    projects[0];
  const featuredImage = featured?.images.find(
    (image) => image.id === featured.coverId,
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !lightboxOpen) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus();
    };
  }, [lightboxOpen]);

  function movePhoto(direction: number) {
    setSelected((current) =>
      current
        ? {
            ...current,
            index:
              (current.index + direction + current.images.length) %
              current.images.length,
          }
        : null,
    );
  }

  return (
    <div className="confirmed-portfolio">
      <div className="cp-container">
        <section className="cp-hero" aria-labelledby="portfolio-title">
          <div>
            <p className="cp-eyebrow">SIRINX / SELECTED INSTALLATIONS</p>
            <h1 id="portfolio-title">
              {text.heading}
              <br />
              <span>{text.accent}</span>
            </h1>
            <p className="cp-intro">{text.intro}</p>
            {projects.length > 0 && (
              <div className="cp-stats">
                <div>
                  <strong>{projects.length}</strong>
                  <span>{text.project}</span>
                </div>
                <div>
                  <strong>{allPhotoCount}</strong>
                  <span>{text.photos}</span>
                </div>
                <div>
                  <strong>{allVideoCount}</strong>
                  <span>{text.videos}</span>
                </div>
              </div>
            )}
          </div>
          {featuredImage && (
            <figure className="cp-hero-image">
              <ProjectPhoto image={featuredImage} priority />
              <figcaption lang="th">{featured.title}</figcaption>
            </figure>
          )}
        </section>

        {projects.length > 0 && (
          <div className="cp-toolbar">
            <div className="cp-toolbar-heading">
              <h2>{text.choose}</h2>
              <p role="status" aria-live="polite">
                {visibleProjects.length} {text.project} · {visiblePhotoCount}{" "}
                {text.photos}
              </p>
            </div>
            <div className="cp-filters" role="group" aria-label={text.choose}>
              <button
                type="button"
                aria-pressed={effectiveFilter === "all"}
                onClick={() => setFilter("all")}
              >
                {text.all}
              </button>
              {projects.map((project) => (
                <button
                  type="button"
                  key={project.id}
                  lang="th"
                  aria-pressed={effectiveFilter === project.id}
                  onClick={() => setFilter(project.id)}
                >
                  {project.shortTitle}
                </button>
              ))}
            </div>
          </div>
        )}

        {portfolio.status === "loading" && (
          <p className="cp-state" role="status">
            {text.loading}
          </p>
        )}
        {portfolio.status === "error" && (
          <div className="cp-state" role="alert">
            <p>{text.error}</p>
            <button
              type="button"
              className="cp-retry"
              onClick={() => void projectQuery.refetch()}
            >
              {text.retry}
            </button>
          </div>
        )}
        {portfolio.status === "ready" && projects.length === 0 && (
          <p className="cp-state" role="status">
            {text.empty}
          </p>
        )}

        {visibleProjects.map((project) => (
          <section
            className="cp-project"
            key={project.id}
            data-project={project.id}
            aria-labelledby={`project-${project.id}`}
          >
            <div className="cp-project-heading" lang="th">
              <p className="cp-eyebrow">
                {project.category} · {project.images.length} ภาพ
                {project.videos.length ? " · 1 วิดีโอ" : ""}
              </p>
              <h2 id={`project-${project.id}`}>{project.title}</h2>
              <p className="cp-description">{project.summary}</p>
              <div className="cp-tags">
                <span>{project.scope}</span>
                {project.inverterBrand && (
                  <span>
                    {text.inverter} {project.inverterBrand}
                  </span>
                )}
              </div>
            </div>
            <div className="cp-gallery">
              {project.images.map((image, index) => (
                <figure className="cp-photo" key={image.id}>
                  <button
                    type="button"
                    aria-label={`${text.open}: ${image.caption}`}
                    onClick={(event) => {
                      triggerRef.current = event.currentTarget;
                      setSelected({ images: project.images, index });
                    }}
                  >
                    <ProjectPhoto image={image} />
                    <span className="cp-expand" aria-hidden="true">
                      <ArrowUpRight size={17} />
                    </span>
                  </button>
                  <figcaption lang="th">{image.caption}</figcaption>
                </figure>
              ))}
            </div>
            {project.videos.map((video) => (
              <figure className="cp-video" key={video.id}>
                <figcaption>
                  <p className="cp-eyebrow">{text.video}</p>
                  <h3 lang="th">{video.caption}</h3>
                  <p>
                    {Math.round(video.durationSeconds)} {text.seconds}
                  </p>
                </figcaption>
                <video
                  controls
                  playsInline
                  preload="metadata"
                  poster={video.poster}
                  width={video.width}
                  height={video.height}
                  aria-label={video.caption}
                >
                  <source src={video.src} type="video/mp4" />
                  <a href={video.src}>{text.video}</a>
                </video>
              </figure>
            ))}
          </section>
        ))}

        <section className="cp-cta">
          <div>
            <h2>{text.cta}</h2>
            <p>{text.ctaBody}</p>
          </div>
          <div className="cp-cta-links">
            <Link href="/contact" className="cp-primary-link">
              {text.contact}
              <ArrowRight size={17} />
            </Link>
            <Link href="/assessment">
              {text.assessment}
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </div>
      <dialog
        className="cp-dialog"
        ref={dialogRef}
        aria-labelledby="photo-title"
        onCancel={() => setSelected(null)}
        onClose={() => setSelected(null)}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            movePhoto(-1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            movePhoto(1);
          }
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            setSelected(null);
        }}
      >
        <div className="cp-dialog-heading">
          <h2 id="photo-title" lang="th">
            {activeImage?.alt}
          </h2>
          <button
            type="button"
            aria-label={text.close}
            onClick={() => setSelected(null)}
          >
            <X size={23} />
          </button>
        </div>
        {activeImage && (
          <img
            className="cp-dialog-image"
            src={activeImage.src}
            alt={activeImage.alt}
          />
        )}
        <div className="cp-dialog-controls">
          <button
            type="button"
            aria-label={text.previous}
            onClick={() => movePhoto(-1)}
          >
            <ChevronLeft size={22} />
          </button>
          <span aria-live="polite">
            {selected ? selected.index + 1 : 0} / {selected?.images.length ?? 0}
          </span>
          <button
            type="button"
            aria-label={text.next}
            onClick={() => movePhoto(1)}
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </dialog>
    </div>
  );
}
