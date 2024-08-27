const db = require('../models/index.js');
const { Group, GroupBadge, Post } = db;
const { Op, fn, col, literal } = require('sequelize');

// Badge 아이디
const BADGE_CONSECUTIVE_DAYS_7 = 1; // "7일 연속 추억 등록"
const BADGE_POST_COUNT_20 = 2; // "추억 수 20개 이상 등록"
const BADGE_GROUP_AGE_1_YEAR = 3; // "그룹 생성 후 1년 달성"
const BADGE_GROUP_LIKE_COUNT_10000 = 4; // "그룹 공감 1만 개 이상 받기"
const BADGE_POST_LIKE_COUNT_10000 = 5; // "추억 공감 1만 개 이상 받기"

const awardBadge = async (groupId, badgeId) => {
  await GroupBadge.findOrCreate({
    where: { groupId, badgeId },
    defaults: { groupId, badgeId }
  });
};

const checkConsecutiveDays = async (groupId) => {
  const currentDate = new Date();
  const startDate = new Date(currentDate);
  startDate.setDate(currentDate.getDate() - 6);

  const posts = await Post.findAll({
    where: {
      groupId,
      createdAt: {
        [Op.between]: [startDate, currentDate]
      },
    },
    attributes: [fn('DATE', col('createdAt'))],
    group: [fn('DATE', col('createdAt'))],
    having: literal('COUNT(DISTINCT DATE(createdAt)) = 7')
  });

  if (posts.length > 0) {
    await awardBadge(groupId, BADGE_CONSECUTIVE_DAYS_7);
  }
};

const checkPostCount = async (groupId) => {
  const postCount = await Post.count({
    where: { groupId }
  });

  if (postCount >= 20) {
    await awardBadge(groupId, BADGE_POST_COUNT_20);
  }
};

const checkGroupAge = async (groupId) => {
  const group = await Group.findByPk(groupId, {
    attributes: ['createdAt']
  });
  const currentDate = new Date();
  const createdAt = group.createdAt;
  const oneYearLater = new Date(createdAt);
  oneYearLater.setFullYear(oneYearLater.getFullYear()+1);
  
  if (currentDate >= oneYearLater) {
    await awardBadge(groupId, BADGE_GROUP_AGE_1_YEAR);
  }
};

const checkGroupLikeCount = async (groupId) => {
  const group = await Group.findByPk(groupId, {
    attributes: ['likeCount']
  });
  if (group.likeCount >= 10000) {
    await awardBadge(groupId, BADGE_GROUP_LIKE_COUNT_10000)
  }
};

const checkPostLikeCount = async (postId) => {
  const posts = await Post.findByPk(postId, {
    attributes: ['groupId', 'likeCount']
  });
  
  if (posts.likeCount >= 10000) {
    await awardBadge(posts.groupId, BADGE_POST_LIKE_COUNT_10000);
  }
};

module.exports = {
  checkConsecutiveDays,
  checkPostCount,
  checkGroupAge,
  checkGroupLikeCount,
  checkPostLikeCount
};