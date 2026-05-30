import { CONSULT_PHONE, ZALO_OA_STATUS, ZALO_OA_URL } from "../../siteConfig";
import { BabyCarWidget } from "./BabyCarWidget";

const consultPhoneHref = CONSULT_PHONE.replace(/\s/g, "");
const isZaloPlaceholder = ZALO_OA_URL.startsWith("#");
const zaloAriaLabel = isZaloPlaceholder ? `Chat Zalo OA - ${ZALO_OA_STATUS}` : "Chat Zalo OA";

export function FloatingContact() {
  return (
    <aside aria-label="Liên hệ nhanh" className="floating-contact">
      <BabyCarWidget />
      <a
        aria-label={zaloAriaLabel}
        className="floating-contact__button floating-contact__button--zalo"
        href={ZALO_OA_URL}
        title={ZALO_OA_STATUS}
      >
        <span aria-hidden="true">Z</span>
        <strong>Zalo OA</strong>
      </a>
      <a
        aria-label="Gọi điện tư vấn"
        className="floating-contact__button floating-contact__button--phone"
        href={`tel:${consultPhoneHref}`}
      >
        <span aria-hidden="true">☎</span>
        <strong>Gọi điện</strong>
      </a>
    </aside>
  );
}
