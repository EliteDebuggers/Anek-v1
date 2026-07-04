export const getRelativeTime = (date) => {
  if (!date) return 'Just now';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  
  if (diffMs < 0) return 'Just now';
  
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${diffDays}d ago`;
};

export const serializeUser = (user) => {
  if (!user) return null;
  return {
    id: user._id,
    name: user.name,
    username: user.username,
    joinedAt: user.joinedAt || user.createdAt,
    rank: user.rank,
    points: user.points,
    profilePicture: user.profilePicture || '',
  };
};

export const serializeIssue = (issue, votesCount, commentsList = [], mediaList = []) => {
  if (!issue) return null;
  
  // Format comments to match frontend: { author: string, text: string }
  const formattedComments = commentsList.map(comment => {
    const authorName = comment.user && comment.user.username 
      ? comment.user.username 
      : 'citizen';
    return {
      id: comment._id,
      author: authorName,
      text: comment.text,
      createdAt: comment.createdAt,
    };
  });

  // Extract media properties
  const mediaUrl = mediaList.length > 0 ? mediaList[0].url : '';
  const mediaType = mediaList.length > 0 ? mediaList[0].type : '';

  return {
    id: issue._id,
    title: issue.title,
    category: issue.category,
    author: issue.author && issue.author.username ? issue.author.username : 'unknown',
    time: getRelativeTime(issue.createdAt),
    description: issue.description,
    urgency: issue.urgency,
    votes: votesCount || 0,
    status: issue.status,
    comments: formattedComments,
    responsibleUser: issue.responsibleUser && issue.responsibleUser.username 
      ? issue.responsibleUser.username 
      : null,
    mediaUrl,
    mediaType,
    location: issue.location,
    locationName: issue.locationName || '',
    createdAt: issue.createdAt,
  };
};

export const serializeContribution = (transaction) => {
  if (!transaction) return null;

  // Map transaction to frontend-compatible contribution log:
  // { id, category, activity, timestamp, points, status }
  let status = 'Verified';
  if (transaction.type === 'EARN') {
    status = transaction.description.includes('Reported') ? 'Reported' : 'Verified';
  } else if (transaction.type === 'REDEEM') {
    status = 'Claimed';
  }

  const sign = transaction.amount > 0 ? '+' : '';
  
  return {
    id: transaction._id,
    category: transaction.referenceModel === 'Issue' && transaction.referenceId && transaction.referenceId.category
      ? transaction.referenceId.category 
      : 'Governance',
    activity: transaction.description,
    timestamp: new Date(transaction.createdAt).toLocaleDateString(),
    points: `${sign}${transaction.amount} GCP`,
    status: status,
  };
};

export const serializeLeaderboardUser = (user, numericalRank) => {
  if (!user) return null;
  return {
    name: user.name,
    username: user.username,
    rank: numericalRank,
    title: user.rank, // Vanguard Rank I/II/Elder
    points: user.points,
    profilePicture: user.profilePicture || '',
  };
};

export const serializeNotification = (notification) => {
  if (!notification) return null;
  return {
    id: notification._id,
    recipient: notification.recipient,
    sender: notification.sender && notification.sender.username ? notification.sender.username : null,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  };
};
