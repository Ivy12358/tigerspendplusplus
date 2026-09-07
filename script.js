const fileInput = document.querySelector("#file-input");
const fileList = document.querySelector("#file-list");
const emptyState = document.querySelector("#empty-state");
const addFilesButton = document.querySelector("#add-files");
const startDate = document.querySelector("#start-date");
const semesterEndDate = document.querySelector("#semester-end-date");
const endGoal = document.querySelector("#end-goal");
const endGoalValue = document.querySelector("#end-goal-value");
const loadChartsButton = document.querySelector("#load-charts");
const chartGrid = document.querySelector("#overview .chart-grid");

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
  processCsvFiles(uploadedFiles, startDate.value, semesterEndDate.value, Number(endGoal.value));
});

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

fileInput.addEventListener("change", () => {
  const newFiles = Array.from(fileInput.files).filter((file) => {
    const isCsv = file.name.toLowerCase().endsWith(".csv");
    const isDuplicate = uploadedFiles.some((uploadedFile) => {
      return uploadedFile.name === file.name
        && uploadedFile.size === file.size
        && uploadedFile.lastModified === file.lastModified;
    });

    return isCsv && !isDuplicate;
  });

  uploadedFiles = [...uploadedFiles, ...newFiles];
  fileInput.value = "";
  renderFileList();
});