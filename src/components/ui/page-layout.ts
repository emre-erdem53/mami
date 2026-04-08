/**
 * Büyük / ultra-wide monitörlerde boş alan birikmesin diye kırılımlarla genişleyen sarmalayıcı.
 * Ana içerik alanı (sidebar sonrası) zaten `w-full`; bu sınıf üst sınırı viewport’a göre yükseltir.
 */
export const pageWrap =
  "mx-auto w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[90rem] min-[1800px]:max-w-[110rem] min-[2200px]:max-w-[128rem]";

/** Pipeline / geniş tablo sayfaları — neredeyse tam genişlik */
export const pageWrapWide =
  "mx-auto w-full max-w-[1800px] min-[1920px]:max-w-[min(1920px,calc(100vw-14rem))] min-[2400px]:max-w-[min(2200px,calc(100vw-15rem))]";
