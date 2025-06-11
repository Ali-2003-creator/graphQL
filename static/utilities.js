// Function to show the modal
export function showModal(modal, modalMessage, message, status) {
  modalMessage.textContent = message;
  modal.style.display = "flex";

  if (status === true) {
    modalMessage.style.color = "var(--primary)";
  } else {
    modalMessage.style.color = "var(--danger)";
  }
}