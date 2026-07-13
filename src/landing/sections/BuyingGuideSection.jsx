/**

 * Buying advice block — renders structured editorial from registry config only.

 */



export default function BuyingGuideSection({ config }) {

  const advice = config?.buyingAdvice;

  const sections = advice?.sections || [];

  if (!sections.length) return null;



  const title = advice.title || "Buying advice";



  return (

    <section

      className="landing-buying-guide"

      data-content-block="buyingGuide"

      aria-labelledby="landing-buying-guide-title"

    >

      <h2 id="landing-buying-guide-title" className="landing-section__title">

        {title}

      </h2>

      {sections.map((block) => (

        <article key={block.heading} className="landing-buying-guide__block">

          <h3 className="landing-buying-guide__heading">{block.heading}</h3>

          {(block.paragraphs || []).map((paragraph) => (

            <p key={paragraph.slice(0, 48)}>{paragraph}</p>

          ))}

          {block.bullets?.length ? (

            <ul className="landing-buying-guide__list">

              {block.bullets.map((item) => (

                <li key={item.slice(0, 48)}>{item}</li>

              ))}

            </ul>

          ) : null}

        </article>

      ))}

    </section>

  );

}


