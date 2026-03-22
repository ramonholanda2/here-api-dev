function showToast(message, type = "success", duration = 2000) {
    const container = document.getElementById("toast-container");

    const toast = document.createElement("div");
    toast.classList.add("toast", type);

    toast.style.opacity = "0";         
    toast.style.transform = "translateY(-10px)";
    toast.textContent = message;

    container.appendChild(toast);

    void toast.offsetWidth;

    toast.style.transition = "opacity 0.4s ease, transform 0.4s ease";
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-10px)";
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

export { showToast };