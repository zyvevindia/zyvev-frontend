import SEO from "./SEO";
import { metaToSeoProps } from "../../seo/pageMetadata";

/**
 * Renders <SEO /> from buildPageMeta / pageMetadata output.
 */
export default function SeoHead({ meta, ...overrides }) {
  const props = {
    ...metaToSeoProps(meta),
    ...overrides,
  };

  return <SEO {...props} />;
}
