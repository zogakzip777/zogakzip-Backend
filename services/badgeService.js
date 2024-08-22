const db = require('../models/index.js');
const { Group, GroupBadge, Post } = db;
const { Op, fn, col, literal } = require('sequelize');

const badges = {
  1: "7일 연속 추억 등록",
  2: "추억 수 20개 이상 등록",
  3: "그룹 생성 후 1년 달성",
  4: "그룹 공감 1만 개 이상 받기",
  5: "추억 공감 1만 개 이상 받기"
};

const awardBadge = async (groupId, badgeId) => {
  await GroupBadge.findOrCreate({
    where: { groupId, badgeId },
    defaults: { groupId, badgeId }
  });
  console.log(groupId, badges[badgeId])
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
  return posts.length > 0;
};

const checkPostCount = async (groupId) => {
  const posts = await Post.count({
    where: { groupId }
  });
  return posts.length >= 20;
};

const checkGroupAge = async (groupId) => {
  const group = await Group.findByPk(groupId, {
    attributes: ['createdAt']
  });
  const currentDate = new Date();
  const createdAt = group.createdAt;
  const oneYearLater = new Date(createdAt);
  oneYearLater.setFullYear(oneYearLater.getFullYear());
  return currentDate >= oneYearLater;
};

const checkGroupLikeCount = async (groupId) => {
  const group = await Group.findByPk(groupId, {
    attributes: ['likeCount']
  });
  return group.likeCount >= 10000;
};

const checkPostLikeCount = async (groupId) => {
  const posts = await Post.findAll({
    where: { 
      groupId,
      likeCount: {
        [Op.gte]: 10000
      }
    }
  });
  return posts.length > 0;
};

module.exports = {
  awardBadge,
  checkConsecutiveDays,
  checkPostCount,
  checkGroupAge,
  checkGroupLikeCount,
  checkPostLikeCount
};