export default function FaqSection({ config }) {
  const faq = config?.faq || [];
  if (!faq.length) return null;

  return (
    <section
      className="landing-faq"
      data-content-block="faq"
      aria-labelledby="landing-faq-title"
    >
      <h2 id="landing-faq-title" className="landing-section__title">
        Frequently asked questions
      </h2>
      <dl className="landing-faq__list">
        {faq.map((item) => (
          <div key={item.question} className="landing-faq__item">
            <dt>{item.question}</dt>
            <dd>{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
