import SiteLayout from "./(site)/layout";
import SiteNotFound from "./(site)/not-found";

/** Eşleşmeyen tüm adresler için site düzeniyle 404 */
export default function NotFound() {
  return (
    <SiteLayout>
      <SiteNotFound />
    </SiteLayout>
  );
}
