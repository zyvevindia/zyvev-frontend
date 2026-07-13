export default function IntroSection({ config }) {
  const intro = config?.intro;
  if (!intro) return null;

  const paragraphs = Array.isArray(intro) ? intro : [intro];
  const title = config?.introTitle || "Overview";

  return (
    <section
      className="landing-intro"
      data-content-block="intro"
      aria-labelledby="landing-intro-title"
    >
      <h2 id="landing-intro-title" className="landing-section__title">
        {title}
      </h2>
      {paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 48)}>{paragraph}</p>
      ))}
    </section>
  );
}
