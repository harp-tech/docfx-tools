export default {
    init: function() {
        const brand = document.querySelector("a.navbar-brand");
        if (!brand) return;

        const textNodes = Array.from(brand.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
        const name = textNodes.map(node => node.textContent).join("").trim();
        if (!name) return;

        const rel = document.querySelector('meta[name="docfx:rel"]')?.getAttribute("content") ?? "";
        const home = document.createElement("a");
        home.className = "navbar-brand";
        home.href = rel + "index.html";
        home.textContent = name;

        textNodes.forEach(node => node.remove());
        brand.classList.add("me-2");
        brand.after(home);
    }
}
