export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'à l\'instant';
  } else if (diffMin < 60) {
    return `il y a ${diffMin} min`;
  } else if (diffHour < 24) {
    return `il y a ${diffHour}h`;
  } else if (diffDay === 1) {
    return 'hier';
  } else if (diffDay < 7) {
    return `il y a ${diffDay}j`;
  } else {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}
