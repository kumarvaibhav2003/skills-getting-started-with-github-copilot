document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // reset select options (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.dataset.activityName = name;

        const spotsLeft = details.max_participants - details.participants.length;

        const title = document.createElement("h4");
        title.textContent = name;

        const desc = document.createElement("p");
        desc.textContent = details.description;

        const schedule = document.createElement("p");
        schedule.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;

        const availability = document.createElement("p");
        availability.className = "availability";
        availability.textContent = `${spotsLeft} spots left`;

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsTitle = document.createElement("strong");
        participantsTitle.textContent = "Participants:";

        const ul = document.createElement("ul");
        ul.className = "participants-list";

        if (details.participants.length === 0) {
          const li = document.createElement("li");
          li.innerHTML = `<em>No participants yet</em>`;
          ul.appendChild(li);
        } else {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const span = document.createElement("span");
            span.className = "participant-email";
            span.textContent = p;

            const del = document.createElement("button");
            del.type = "button";
            del.className = "participant-delete";
            del.title = `Unregister ${p}`;
            del.setAttribute("aria-label", `Unregister ${p}`);
            del.textContent = "×";

            del.addEventListener("click", async (e) => {
              e.preventDefault();
              try {
                const resp = await fetch(`/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`, { method: "POST" });
                if (resp.ok) {
                  // remove list item
                  li.remove();

                  // if no participants left, show placeholder
                  if (ul.querySelectorAll("li").length === 0) {
                    const placeholder = document.createElement("li");
                    placeholder.innerHTML = `<em>No participants yet</em>`;
                    ul.appendChild(placeholder);
                  }

                  // update availability text
                  const newSpots = details.max_participants - (details.participants.length - 1);
                  availability.textContent = `${newSpots} spots left`;

                  // also update local details.participants to reflect removal
                  const idx = details.participants.indexOf(p);
                  if (idx !== -1) details.participants.splice(idx, 1);
                } else {
                  const body = await resp.json();
                  alert(body.detail || 'Failed to unregister');
                }
              } catch (err) {
                console.error('Error unregistering:', err);
                alert('Failed to unregister.');
              }
            });

            li.appendChild(span);
            li.appendChild(del);
            ul.appendChild(li);
          });
        }

        participantsSection.appendChild(participantsTitle);
        participantsSection.appendChild(ul);

        activityCard.appendChild(title);
        activityCard.appendChild(desc);
        activityCard.appendChild(schedule);
        const availWrap = document.createElement('p');
        availWrap.innerHTML = `<strong>Availability:</strong> `;
        availWrap.appendChild(availability);
        activityCard.appendChild(availWrap);
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // refresh activities to reflect new participant and wait for it to finish
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
