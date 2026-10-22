import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

const galleryItems = [
  { label: 'Procedure room', img: 'hospital-gallery-0.jpg', desc: 'Sterile clinical procedure suite with examination and procedure table, overhead light, and emergency medical equipment.' },
  { label: 'In-house laboratory', img: 'hospital-gallery-1.jpg', desc: 'Fully equipped diagnostic laboratory with automated biochemistry, hematology analyzers, and testing equipment.' },
  { label: 'Operating theatre', img: 'hospital-gallery-2.jpg', desc: 'Advanced laminar-flow surgical suite with dual surgical lights, patient monitors, and anaesthesia workstation.' },
  { label: 'Blood testing & diagnostics', img: 'hospital-gallery-blood-test.jpg', desc: 'Routine and comprehensive blood investigations, CBC, lipid profiles, liver & kidney panels, and hormone tests.' }
];

export const HospitalGallery: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // Close on Escape or navigate on arrow keys
  useEffect(() => {
    if (selectedIdx === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedIdx(null);
      if (e.key === 'ArrowLeft') setSelectedIdx(prev => (prev !== null ? (prev + galleryItems.length - 1) % galleryItems.length : null));
      if (e.key === 'ArrowRight') setSelectedIdx(prev => (prev !== null ? (prev + 1) % galleryItems.length : null));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIdx]);

  return (
    <section id="gallery" className="hospital-gallery">
      <div className="gallery-heading">
        <span className="hospital-eyebrow">A CLOSER LOOK AT YOUR HOSPITAL</span>
        <h2>Spaces designed around care.</h2>
        <p>Explore photographs from We Care Hospital and meet the environment behind your care.</p>
      </div>

      <div className="hospital-gallery-grid">
        {galleryItems.map(({ label, img }, i) => (
          <button
            type="button"
            className="gallery-card"
            key={label}
            onClick={() => setSelectedIdx(i)}
            aria-haspopup="dialog"
            aria-label={`View photo of ${label}`}
          >
            <div className="gallery-card-img-wrap">
              <img src={`/images/${img}`} alt={label} loading="lazy" />
              <span className="gallery-card-badge"><Maximize2 size={13} /> Enlarge</span>
            </div>
            <span className="gallery-card-label">
              <strong>{label}</strong>
              <Maximize2 size={15} className="gallery-card-icon" />
            </span>
          </button>
        ))}
      </div>

      {selectedIdx !== null && (
        <div
          className="gallery-lightbox-backdrop"
          onClick={() => setSelectedIdx(null)}
          role="dialog"
          aria-modal="true"
          aria-label={galleryItems[selectedIdx].label}
        >
          <div className="gallery-lightbox-modal" onClick={e => e.stopPropagation()}>
            <div className="gallery-lightbox-header">
              <div className="gallery-lightbox-title">
                <span>{galleryItems[selectedIdx].label}</span>
                <span className="gallery-lightbox-count">{selectedIdx + 1} of {galleryItems.length}</span>
              </div>
              <button
                type="button"
                className="gallery-lightbox-close"
                onClick={() => setSelectedIdx(null)}
                aria-label="Close photo popup"
              >
                <X size={20} />
              </button>
            </div>
            <div className="gallery-lightbox-body">
              <button
                type="button"
                className="gallery-lightbox-nav gallery-lightbox-prev"
                onClick={() => setSelectedIdx((selectedIdx + galleryItems.length - 1) % galleryItems.length)}
                aria-label="Previous photo"
              >
                <ChevronLeft size={22} />
              </button>
              <img
                src={`/images/${galleryItems[selectedIdx].img}`}
                alt={galleryItems[selectedIdx].label}
              />
              <button
                type="button"
                className="gallery-lightbox-nav gallery-lightbox-next"
                onClick={() => setSelectedIdx((selectedIdx + 1) % galleryItems.length)}
                aria-label="Next photo"
              >
                <ChevronRight size={22} />
              </button>
            </div>
            {galleryItems[selectedIdx].desc && (
              <div className="gallery-lightbox-caption">
                {galleryItems[selectedIdx].desc}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="hospital-media">
        <div>
          <h3>Our surgical team at work</h3>
          <p>A short hospital video. Contains clinical footage.</p>
          <video controls muted playsInline preload="none" poster="/images/surgical-team.jpg" src="/media/hospital-team.mp4" />
        </div>
        <div className="diagnostic-summary">
          <span className="hospital-eyebrow">AVAILABLE AT WE CARE</span>
          <h3>Health checks & diagnostic facilities</h3>
          <p>Everyday screening and laboratory investigations, with assistance from our hospital team.</p>
          <ul>
            <li><strong>Routine screening</strong>Blood pressure, oxygen saturation, pulse, temperature, weight and blood sugar.</li>
            <li><strong>Organ health & metabolic tests</strong>Kidney and liver function, lipid profile and electrolytes.</li>
            <li><strong>Blood & hormone investigations</strong>Blood counts, iron profile, thyroid profile, vitamin B12, vitamin D and testosterone.</li>
            <li><strong>Additional diagnostic support</strong>ESR, hs-CRP, calcium testing, ECG and an in-house pharmacy.</li>
          </ul>
          <p className="test-note">Contact reception for test availability and preparation instructions.</p>
          <a className="hospital-text-button" href="#appointment">Enquire about a health check →</a>
        </div>
      </div>
    </section>
  );
};
