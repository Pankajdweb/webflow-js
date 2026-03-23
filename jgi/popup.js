// OPEN POPUP
document.addEventListener("click", function (e) {
    const btn = e.target.closest("[popup-trigger]");
    if (!btn) return;

    const popupatr = btn.getAttribute("popup-trigger");
    if (!popupatr || popupatr === "undefined") return;

    const popup = document.querySelector(`[popup-data="${popupatr}"]`);
    if (!popup) return;

    e.preventDefault();

    // 👉 Update URL hash
    window.location.hash = popupatr;

    openPopup(popup);
});


// CLOSE POPUP
document.addEventListener("click", function (e) {
    const closeBtn = e.target.closest("[popup-close]");
    if (!closeBtn) return;

    const popup = closeBtn.closest("[popup-data]");
    if (!popup) return;

    closePopup(popup);

    // 👉 Remove hash from URL
    history.pushState("", document.title, window.location.pathname + window.location.search);
});


// 👉 Function to open popup
function openPopup(popup) {
    gsap.set(popup, { display: "block" });
    gsap.to(popup, {
        opacity: 1,
        duration: 0.5,
        ease: "power2.out",
    });

    document.body.style.overflow = "hidden";
}


// 👉 Function to close popup
function closePopup(popup) {
    gsap.to(popup, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
            gsap.set(popup, { display: "none" });
            document.body.style.overflow = "auto";
        }
    });
}


// 👉 AUTO OPEN POPUP FROM URL
window.addEventListener("load", function () {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;

    const popup = document.querySelector(`[popup-data="${hash}"]`);
    if (popup) {
        openPopup(popup);
    }
});
