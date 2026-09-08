const fileInput = document.querySelector("#file-input");
const fileList = document.querySelector("#file-list");
const emptyState = document.querySelector("#empty-state");
const uploadsPanel = document.querySelector(".uploads-panel");
const addFilesButton = document.querySelector("#add-files");
const startDate = document.querySelector("#start-date");
const semesterEndDate = document.querySelector("#semester-end-date");
const endGoal = document.querySelector("#end-goal");
const endGoalValue = document.querySelector("#end-goal-value");
const loadChartsButton = document.querySelector("#load-charts");
const chartGrid = document.querySelector("#overview .chart-grid");
const termProgress = document.querySelector("#term-progress");
const termProgressValue = document.querySelector("#term-progress-value");
const balanceProgress = document.querySelector("#balance-progress");
const balanceProgressValue = document.querySelector("#balance-progress-value");
const dailyBudgetValue = document.querySelector("#daily-budget-value");
const twoWeekSpendingValue = document.querySelector("#two-week-spending-value");
const welcomeModal = document.querySelector("#welcome-modal");
const dismissWelcomeButton = document.querySelector("#dismiss-welcome");
const openHelpButton = document.querySelector("#open-help");

if (!localStorage.getItem("tigerspend-welcome-seen")) {
  welcomeModal.showModal();
}

dismissWelcomeButton.addEventListener("click", () => {
  localStorage.setItem("tigerspend-welcome-seen", "true");
  welcomeModal.close();
});

openHelpButton.addEventListener("click", () => {
  localStorage.setItem("tigerspend-welcome-seen", "true");
  window.location.href = "how-to.html";
});

let uploadedFiles = [];

startDate.value = `${new Date().getFullYear()}-08-20`;
semesterEndDate.value = `${new Date().getFullYear()}-12-10`;

endGoal.addEventListener("input", () => {
  endGoalValue.textContent = `$${Number(endGoal.value).toLocaleString()}`;
  updateEndGoalTrack();
});

function updateEndGoalTrack() {
  const progress = ((endGoal.value - endGoal.min) / (endGoal.max - endGoal.min)) * 100;
  endGoal.style.setProperty("--range-progress", `${progress}%`);
}

updateEndGoalTrack();

loadChartsButton.addEventListener("click", () => {
  chartGrid.classList.add("charts-loaded");
  renderProgressSummary();
  processCsvFiles(uploadedFiles, startDate.value, semesterEndDate.value, Number(endGoal.value));
});

function dateFromInput(dateString) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ? new Date(`${dateString}T00:00:00`)
    : null;
}

function getDaysLeft(endDate) {
  const today = new Date();
  const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const difference = endDate - currentDate;
  return Math.max(0, Math.floor(difference / (1000 * 60 * 60 * 24)) + 1);
}

function renderProgressSummary(balanceSummary) {
  const selectedStartDate = dateFromInput(startDate.value);
  const selectedEndDate = dateFromInput(semesterEndDate.value);

  if (!selectedStartDate || !selectedEndDate || selectedEndDate <= selectedStartDate) {
    return;
  }

  const now = new Date();
  const termLength = selectedEndDate - selectedStartDate;
  const termProgressPercent = Math.min(100, Math.max(0, ((now - selectedStartDate) / termLength) * 100));
  const termProgressText = `${Math.round(termProgressPercent)}%`;

  termProgress.value = termProgressPercent;
  termProgressValue.textContent = termProgressText;

  if (!balanceSummary) {
    return;
  }

  const { currentBalance, initialBalance } = balanceSummary;
  const balanceProgressPercent = initialBalance > 0
    ? Math.min(100, Math.max(0, ((initialBalance - currentBalance) / initialBalance) * 100))
    : 0;
  const daysLeft = getDaysLeft(selectedEndDate);
  const dailyBudget = daysLeft > 0
    ? Math.max(0, (currentBalance - Number(endGoal.value)) / daysLeft)
    : 0;

  balanceProgress.value = balanceProgressPercent;
  balanceProgressValue.textContent = `${Math.round(balanceProgressPercent)}% spent`;
  dailyBudgetValue.textContent = `$${dailyBudget.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

  if (balanceSummary.twoWeekAverage !== null) {
    twoWeekSpendingValue.textContent = `$${balanceSummary.twoWeekAverage.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} / day`;
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderFileList() {
  fileList.replaceChildren();
  emptyState.hidden = uploadedFiles.length > 0;

  uploadedFiles.forEach((file, index) => {
    const listItem = document.createElement("li");
    listItem.className = "file-item";

    const fileDetails = document.createElement("div");
    fileDetails.className = "file-details";

    const fileName = document.createElement("span");
    fileName.className = "file-name";
    fileName.textContent = file.name;
    fileName.title = file.name;

    const fileSize = document.createElement("span");
    fileSize.className = "file-size";
    fileSize.textContent = formatFileSize(file.size);

    const removeButton = document.createElement("button");
    removeButton.className = "remove-file";
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.setAttribute("aria-label", `Remove ${file.name}`);
    removeButton.addEventListener("click", () => {
      uploadedFiles.splice(index, 1);
      renderFileList();
    });

    fileDetails.append(fileName, fileSize);
    listItem.append(fileDetails, removeButton);
    fileList.append(listItem);
  });
}

addFilesButton.addEventListener("click", () => {
  fileInput.click();
});

function addFiles(files) {
  const newFiles = Array.from(files).filter((file) => {
    const isCsv = file.name.toLowerCase().endsWith(".csv");
    const isDuplicate = uploadedFiles.some((uploadedFile) => {
      return uploadedFile.name === file.name
        && uploadedFile.size === file.size
        && uploadedFile.lastModified === file.lastModified;
    });

    return isCsv && !isDuplicate;
  });

  uploadedFiles = [...uploadedFiles, ...newFiles];
  renderFileList();
}

fileInput.addEventListener("change", () => {
  addFiles(fileInput.files);
  fileInput.value = "";
});

uploadsPanel.addEventListener("dragover", (event) => {
  if (event.dataTransfer.types.includes("Files")) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    uploadsPanel.classList.add("drag-over");
  }
});

uploadsPanel.addEventListener("dragleave", (event) => {
  if (!uploadsPanel.contains(event.relatedTarget)) {
    uploadsPanel.classList.remove("drag-over");
  }
});

uploadsPanel.addEventListener("drop", (event) => {
  event.preventDefault();
  uploadsPanel.classList.remove("drag-over");
  addFiles(event.dataTransfer.files);
});