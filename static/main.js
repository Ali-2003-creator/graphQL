import { displayLoginForm, displayProfile, displayXPStats, displayObjStats } from "./display.js";
import { queryGraphQL } from "./graphql.js";
import { showModal } from "./utilities.js";

const loginForm = document.getElementById("login-form");
const body = document.querySelector("body");

const modal = document.getElementById("modal");
const modalMessage = document.getElementById("modal-message");
const closeModal = document.getElementById("close-modal");

//Valid paths
const validPaths = [
  "/",
  "/index.html",
  "/graphQL",           
  "/graphQL/",          
  "/graphQL/index.html" 
];

function getBasePath() {
  // Return the correct base path based on environment
  if (window.location.hostname === 'ali-2003-creator.github.io') {
    return '/graphQL/';
  }
  return '/'; // For local development
}

function isValidRoute(pathname) {
  const normalizedPath = pathname.toLowerCase();
  
  return validPaths.some(route => {
    const normalizedRoute = route.toLowerCase();
    return normalizedPath === normalizedRoute || 
           normalizedPath.endsWith(normalizedRoute) ||
           (normalizedRoute === '/' && normalizedPath === '');
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const jwt = localStorage.getItem("jwt");

  const currentPath = window.location.pathname;

  console.log("current path:", currentPath);
  console.log("current host:", window.location.hostname);

  if(!isValidRoute(currentPath)) {
    showModal(modal, modalMessage, "404 Not Found", false);
    return;
  }

  if (!jwt) {
    displayLoginForm(body);
    return;
  }

  try {
    // Validate the JWT by querying the server
    const query = `
      query {
        user {
          id
          login
          firstName
          lastName
          createdAt
        }
      }
    `;

    const result = await queryGraphQL(query);
    if (!result || !result.data.user) {
      showModal(modal, modalMessage, "Profile not found. Please log in again.", false);
      localStorage.removeItem("jwt");
      displayLoginForm(body);
      return; 
    }

    // Hide login form and display user data
    if (loginForm) loginForm.style.display = "none";

    const userData = result.data.user[0];
    const ID = userData.id;

    const transactionQuery = `
      query {
        transaction(where: {userId: {_eq: ${ID}}, type: {_eq: "xp"}}) {
          amount
          objectId
          createdAt
        }
        audit(where: { grade: { _is_null: false } }) {
          resultId
          grade
        }
      }
    `
    const transactionResult = await queryGraphQL(transactionQuery);
    if (!transactionResult || !transactionResult.data) {
      showModal(modal, modalMessage, "Failed to fetch transactions or audits.", false);
      return;
    }

    console.log("Transaction Result:", transactionResult);

    const totalXP = transactionResult.data.transaction.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );
    const xpInkB = (Math.round(totalXP / 1000) / 2); // to make the XP in kB
    const totalAudits = transactionResult.data.audit.length;

    displayProfile(body, userData, xpInkB, totalAudits);
    displayXPStats(
      document.querySelector(".xp-stat"),
      transactionResult.data.transaction
    );

    const objectsQuery = `
      query {
        event_user(where: {userId: {_eq: ${ID}}}) {
          eventId
          userId
          event {
            id
            object {
              name
              type
              createdAt
            }
          }
        }
      }
    `
    const objectResult = await queryGraphQL(objectsQuery);
    if (!objectResult || !objectResult.data) {
      showModal(modal, modalMessage, "Failed to fetch objects.", false);
      return;
    }

    displayObjStats(
      document.querySelector(".object-stat"),
      objectResult.data.event_user
    );

  } catch (error) {
    console.error("Error validating JWT:", error);
    localStorage.removeItem("jwt");
    displayLoginForm(body); 
  }
});

// Close modal
closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});


