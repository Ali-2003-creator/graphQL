import { showModal } from "./utilities.js";

// Function to query the GraphQL endpoint
export async function queryGraphQL(query, variables = {}) {
  const jwt = localStorage.getItem("jwt");
  if (!jwt) {
    showModal(modal, "JWT not found. Please log in again.", false);
    console.error("JWT not found in localStorage.");
    return;
  }

  try {
    const response = await fetch(
      "https://learn.reboot01.com/api/graphql-engine/v1/graphql",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ query, variables }),
      }
    );

    if (!response.ok) {
      const errorDetails = await response.text();
      showModal(modal, `GraphQL query failed: ${errorDetails}`, false);
      console.error("GraphQL query error:", errorDetails);
      return;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    showModal(modal, "Failed to query GraphQL.", false);
    console.error("GraphQL query error:", error);
  }
}