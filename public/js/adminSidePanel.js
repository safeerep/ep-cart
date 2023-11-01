const sidePanels = document.querySelectorAll(".admin-side");
const activeId = localStorage.getItem("activeItemId");

sidePanels.forEach((panel) => {
  panel.addEventListener("click", () => {
    sidePanels.forEach((item) => item.classList.remove("active"));
    panel.classList.add("active");
    localStorage.setItem("activeItemId", panel.id);
  });

  if (activeId && panel.id === activeId) {
    panel.classList.add("active");
  }
});
