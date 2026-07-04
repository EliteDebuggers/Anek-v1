import { getRelativeTime, serializeUser, serializeIssue, serializeContribution, serializeLeaderboardUser } from '../utils/responseSerializer.js';

// Simple unit testing framework for our backend components
async function runTests() {
  console.log('=============================================');
  console.log('       ANEK BACKEND UNIT TEST SUITE          ');
  console.log('=============================================');

  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  };

  // Test 1: Relative Time Formatter
  try {
    const now = new Date();
    assert(getRelativeTime(now) === 'Just now', 'Should format current time as "Just now"');

    const tenMinsAgo = new Date(now - 10 * 60 * 1000);
    assert(getRelativeTime(tenMinsAgo) === '10m ago', 'Should format minutes ago correctly');

    const threeHoursAgo = new Date(now - 3 * 60 * 60 * 1000);
    assert(getRelativeTime(threeHoursAgo) === '3h ago', 'Should format hours ago correctly');

    const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000);
    assert(getRelativeTime(twoDaysAgo) === '2d ago', 'Should format days ago correctly');
  } catch (err) {
    console.error('Error in Test 1:', err);
    failed++;
  }

  // Test 2: User Serializer
  try {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Stark Stark',
      username: 'stark_iron',
      points: 170,
      rank: 'Vanguard Rank II',
      createdAt: new Date(),
    };

    const serialized = serializeUser(mockUser);
    assert(serialized.id === '507f1f77bcf86cd799439011', 'User serializer should map id');
    assert(serialized.name === 'Stark Stark', 'User serializer should map name');
    assert(serialized.username === 'stark_iron', 'User serializer should map username');
    assert(serialized.rank === 'Vanguard Rank II', 'User serializer should map rank');
    assert(serialized.points === 170, 'User serializer should map points');
  } catch (err) {
    console.error('Error in Test 2:', err);
    failed++;
  }

  // Test 3: Issue Serializer
  try {
    const mockIssue = {
      _id: '507f1f77bcf86cd799439022',
      title: 'Pothole on Main St',
      category: 'Roads',
      description: 'Massive pothole near the pharmacy.',
      urgency: 'PRIORITY',
      status: 'In Progress',
      location: {
        type: 'Point',
        coordinates: [13.405, 52.52],
      },
      locationName: 'Main St Pharmacy',
      author: { username: 'citizen1' },
      responsibleUser: { username: 'resolver9' },
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
    };

    const votesCount = 12;
    const commentsList = [
      { _id: 'c1', user: { username: 'replier1' }, text: 'Agreed!', createdAt: new Date() }
    ];
    const mediaList = [
      { url: 'https://cloudinary.com/pothole.jpg', type: 'image' }
    ];

    const serialized = serializeIssue(mockIssue, votesCount, commentsList, mediaList);

    assert(serialized.id === '507f1f77bcf86cd799439022', 'Issue serializer should map id');
    assert(serialized.title === 'Pothole on Main St', 'Issue serializer should map title');
    assert(serialized.author === 'citizen1', 'Issue serializer should map author username string');
    assert(serialized.responsibleUser === 'resolver9', 'Issue serializer should map responsibleUser username string');
    assert(serialized.time === '30m ago', 'Issue serializer should compute relative time');
    assert(serialized.votes === 12, 'Issue serializer should map votes count');
    assert(serialized.mediaUrl === 'https://cloudinary.com/pothole.jpg', 'Issue serializer should map media URL');
    assert(serialized.comments.length === 1, 'Issue serializer should contain comments');
    assert(serialized.comments[0].author === 'replier1', 'Comment serializer should map username');
  } catch (err) {
    console.error('Error in Test 3:', err);
    failed++;
  }

  // Test 4: Leaderboard Standings Formatter
  try {
    const mockUser = {
      name: 'Moichi Stark',
      username: 'moichi_m',
      rank: 'Vanguard Elder',
      points: 450,
    };

    const serialized = serializeLeaderboardUser(mockUser, 2);
    assert(serialized.name === 'Moichi Stark', 'Leaderboard serializer should map name');
    assert(serialized.username === 'moichi_m', 'Leaderboard serializer should map username');
    assert(serialized.rank === 2, 'Leaderboard serializer should assign numerical standings position');
    assert(serialized.title === 'Vanguard Elder', 'Leaderboard title should map to user rank');
    assert(serialized.points === 450, 'Leaderboard serializer should map points');
  } catch (err) {
    console.error('Error in Test 4:', err);
    failed++;
  }

  // Test 5: Contribution Log Formatter
  try {
    const mockTransaction = {
      _id: '507f1f77bcf86cd799439044',
      amount: 50,
      type: 'EARN',
      description: 'Resolved issue: Fixed Pothole',
      referenceModel: 'Issue',
      referenceId: { category: 'Roads' },
      createdAt: new Date(),
    };

    const serialized = serializeContribution(mockTransaction);
    assert(serialized.category === 'Roads', 'Contribution serializer should map category from Issue reference');
    assert(serialized.points === '+50 GCP', 'Contribution serializer should format positive points');
    assert(serialized.status === 'Verified', 'Resolution transaction should map to "Verified" status');

    const mockRedemption = {
      _id: '507f1f77bcf86cd799439055',
      amount: -80,
      type: 'REDEEM',
      description: 'Redeemed: Community Garden Pass',
      referenceModel: 'RewardRedemption',
      createdAt: new Date(),
    };

    const serializedRedemption = serializeContribution(mockRedemption);
    assert(serializedRedemption.category === 'Governance', 'Redemption transaction should default to "Governance" category');
    assert(serializedRedemption.points === '-80 GCP', 'Contribution serializer should format negative points');
    assert(serializedRedemption.status === 'Claimed', 'Redemption transaction should map to "Claimed" status');
  } catch (err) {
    console.error('Error in Test 5:', err);
    failed++;
  }

  console.log('=============================================');
  console.log(`TEST RUN COMPLETED: ${passed} Passed, ${failed} Failed`);
  console.log('=============================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
