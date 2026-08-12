"use client";

import { X } from "lucide-react";
import styles from "./styles.module.css";

export default function PreviewModal({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <p className={styles.modalTitle}>{title}</p>
          <button onClick={onClose} className={styles.modalCloseButton}>
            <X size={18} />
          </button>
        </div>

        {/* Works well for PDFs and images. Some file types (e.g. .docx)
            may not render inline and will just show a download prompt —
            that's a browser limitation, not a bug in this code. */}
        <iframe src={url} className={styles.modalFrame} title={title} />
      </div>
    </div>
  );
}

// "use client";

// import { X } from "lucide-react";

// export default function PreviewModal({
//   url,
//   title,
//   onClose,
// }: {
//   url: string;
//   title: string;
//   onClose: () => void;
// }) {
//   return (
//     <div
//       onClick={onClose}
//       style={{
//         position: "fixed",
//         inset: 0,
//         background: "rgba(0,0,0,0.5)",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         zIndex: 50,
//       }}
//     >
//       <div
//         onClick={(e) => e.stopPropagation()} // prevents closing when clicking inside
//         style={{
//           background: "white",
//           borderRadius: 8,
//           width: "80%",
//           height: "80%",
//           display: "flex",
//           flexDirection: "column",
//           overflow: "hidden",
//         }}
//       >
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             padding: 12,
//             borderBottom: "1px solid #eee",
//           }}
//         >
//           <strong>{title}</strong>
//           <button
//             onClick={onClose}
//             style={{ border: "none", background: "none", cursor: "pointer" }}
//           >
//             <X size={20} />
//           </button>
//         </div>

//         {/* Works well for PDFs and images. Some file types (e.g. .docx)
//             may not render inline and will just show a download prompt —
//             that's a browser limitation, not a bug in this code. */}
//         <iframe src={url} style={{ flex: 1, border: "none" }} title={title} />
//       </div>
//     </div>
//   );
// }
