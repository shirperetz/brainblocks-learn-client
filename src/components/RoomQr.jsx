import { useMemo } from "react";
import qrcode from "qrcode-generator";

/**
 * 2026-11-22 (Shir: "QR on the board, so the kids scan instead of typing 6 digits"): the room's join
 * link as a QR code, drawn here (no outside service). Opens /room?room=<code> - the code is filled in.
 */
export default function RoomQr({ code, size = 180, label = true }) {
  const url = `${window.location.origin}/room?room=${code}`;
  const svg = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(url);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  }, [url]);
  return (
    <figure className="room-qr" style={{ width: size }}>
      <div className="room-qr__img" role="img" aria-label={`קוד QR לכניסה לחדר ${code}`} dangerouslySetInnerHTML={{ __html: svg }} />
      {label && <figcaption>מצלמים ונכנסים</figcaption>}
    </figure>
  );
}
