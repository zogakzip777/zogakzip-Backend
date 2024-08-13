const db = require('../models/index.js');
const { Group, GroupBadge, Badge, Post } = db;
const { hashPassword, comparePassword } = require('../utils/passwordUtils.js');

const getGroupById = async (groupId) => {
  try {
    const group = await Group.findByPk(groupId, {
      attributes: ['id', 'name', 'imageUrl', 'isPublic', 'likeCount', 'createdAt', 'introduction'],
    });

    const groupData = group.toJSON();
    groupData.badges = await getBadgesById(groupId);
    groupData.postCount = await getPostCountById(groupId);

    return groupData;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getBadgesById = async (groupId) => {
  try {
    const badges = await GroupBadge.findAll({
      where: { groupId },
      include: {
        model: Badge,
        attributes: ['name']
      },
      attribute: []
    });
  
    const badgeNames = badges.map(groupBadge => groupBadge.Badge.name);
    return badgeNames;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getPostCountById = async (groupId) => {
  try {
    const postCount = await Post.count({
      where: { groupId }
    });

    return postCount;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

exports.createGroup = async (req, res) => {
  const { name, password, imageUrl, isPublic, introduction } = req.body;
  try {
    const hashedPassword = await hashPassword(password);
    const group = await Group.create({
      name,
      password: hashedPassword,
      imageUrl,
      isPublic,
      introduction
    });
    const groupWithDetails = await getGroupById(group.id);
    res.status(201).send(groupWithDetails);
  } catch(e) {
    res.status(404).send({ message: "잘못된 요청입니다" });
  }
};

exports.getGroups = async (req, res) => {
  
};

exports.updateGroup = async (req, res) => {
  
};

exports.deleteGroup = async (req, res) => {
};

exports.getGroup = async (req, res) => {
  const { groupId } = req.params;

  try {
    const group = await getGroupById(groupId);
    res.send(group);
  } catch (error) {
    res.status(400).send({ message: "잘못된 요청입니다" });
  }
};

exports.verifyGroupPassword = async (req, res) => {
  
};

exports.likeGroup = async (req, res) => {
  const { groupId } = req.params;
  try {
    const group = await Group.findByPk(groupId);
    group.likeCount++;

    await group.save();
    res.send({ message: "그룹 공감하기 성공" });
  } catch (error) {
    res.status(404).send({ message: "존재하지 않습니다" });
  }
};

exports.isGroupPublic = async (req, res) => {
  const { groupId } = req.params;
  
  try {
    const group = await Group.findByPk(groupId, {
      attributes: ['id', 'isPublic']
    });
    res.send(group);
  } catch (error) {
    res.status(400).send({ message: "잘못된 요청입니다" });
  }
};