export function formatMessageTime(isoString) {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatMessageDate(isoString) {
  return new Date(isoString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getDayKey(isoString) {
  const date = new Date(isoString);

  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function groupMessagesByDate(messages) {
  const sorted = [...messages].sort(
    (a, b) => new Date(a.sentAt) - new Date(b.sentAt)
  );

  const groups = [];

  sorted.forEach((message) => {
    const key = getDayKey(message.sentAt);
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.key === key) {
      lastGroup.messages.push(message);
    } else {
      groups.push({
        key,
        label: formatMessageDate(message.sentAt),
        messages: [message],
      });
    }
  });

  return groups;
}