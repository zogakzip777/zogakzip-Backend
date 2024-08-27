const db = require('../models/index.js');
const { Group, GroupBadge, Badge, Post } = db;
const { hashPassword, comparePassword } = require('../utils/passwordUtils.js');
const { Op, literal } = require('sequelize');
const { checkGroupLikeCount } = require('../services/badgeService.js');

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
      attributes: []
    });
  
    const badgeNames = badges.map(groupBadge => groupBadge.Badge.name);
    return badgeNames;
  } catch (error) {
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
    res.status(400).send({ message: "잘못된 요청입니다" });
  }
};

exports.getGroups = async (req, res) => {
  const { 
    page = 1, 
    pageSize = 10, 
    sortBy = 'latest', 
    keyword = '', 
    isPublic = true
  } = req.query;

  try {
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    const sortOptions = {
      latest: [['createdAt', 'DESC']],
      mostPosted: [['postCount', 'DESC']],
      mostLiked: [['likeCount', 'DESC']],
      mostBadge: [['badgeCount', 'DESC']]
    };

    const { count: totalItemCount, rows: data } = await Group.findAndCountAll({
      where: {
        isPublic,
        name: {
          [Op.like]: `%${keyword}%`
        }
      },
      order: sortOptions[sortBy],
      offset,
      limit,
      attributes: [
        'id',
        'name',
        'imageUrl',
        'isPublic',
        'likeCount',
        'createdAt',
        'introduction',
        [
          literal(`(
            SELECT COUNT(*)
            FROM GroupBadges AS groupBadge
            WHERE groupBadge.groupId = Group.id
          )`),
          'badgeCount'
        ],
        [
          literal(`(
            SELECT COUNT(*)
            FROM Posts AS post
            WHERE post.groupId = Group.id
          )`),
          'postCount'
        ]
      ],
      subQuery: false
    });

    const currentPage = parseInt(page);
    //const totalItemCount = await Group.count();
    const totalPages = Math.ceil(totalItemCount/limit);

    const response = {
      currentPage,
      totalPages,
      totalItemCount,
      data
    };

    res.send(response);
  } catch (error) {
    console.error(error.message)
    res.status(400).send({ message: "잘못된 요청입니다" });
  }
};

exports.updateGroup = async (req, res) => {
  const { groupId } = req.params;
  const { name, password, imageUrl, isPublic, introduction } = req.body;
  try {
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).send({ message: "존재하지 않습니다" });
    }

    const isMatch = await comparePassword(password, group.password);

    if (!isMatch) {
      return res.status(403).send({ message: "비밀번호가 틀렸습니다" });
    }

    group.name = name;
    group.imageUrl = imageUrl;
    group.isPublic = isPublic;
    group.introduction = introduction;
    await group.save();

    const groupWithDetails = await getGroupById(groupId);
    res.status(200).send(groupWithDetails);
  } catch (error) {
    res.status(400).send({ message: "잘못된 요청입니다" });
  }
};

exports.deleteGroup = async (req, res) => {
  const { groupId } = req.params;
  const { password } = req.body;
  try {
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).send({ message: "존재하지 않습니다" });
    }

    const isMatch = await comparePassword(password, group.password);
    if (!isMatch) {
      return res.status(403).send({ message: "비밀번호가 틀렸습니다" });
    }

    await group.destroy();
    res.status(204).send({ message: "그룹 삭제 성공" });
  } catch (error) {
    res.status(400).send({ message: "잘못된 요청입니다" });
  }
};

exports.getGroup = async (req, res) => {
  const { groupId } = req.params;
  try {
    const group = await getGroupById(groupId);
    res.status(200).send(group);
  } catch (error) {
    res.status(400).send({ message: "잘못된 요청입니다" });
  }
};

exports.verifyGroupPassword = async (req, res) => {
  const { groupId } = req.params;
  const { password } = req.body;
  try {
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).send({ message: "존재하지 않습니다" });
    }

    const isMatch = await comparePassword(password, group.password);
    if (!isMatch) {
      return res.status(401).send({ message: "비밀번호가 틀렸습니다" });
    }
    res.status(200).send({ message: "비밀번호가 확인되었습니다" });
  } catch (error) {
    res.status(400).send({ message: "잘못된 요청입니다" });
  }
};

exports.likeGroup = async (req, res) => {
  const { groupId } = req.params;
  try {
    const group = await Group.findByPk(groupId);
    group.likeCount++;
    await group.save();
    await checkGroupLikeCount(groupId); // 배지 조건 확인
    res.status(200).send({ message: "그룹 공감하기 성공" });
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
    res.status(200).send(group);
  } catch (error) {
    res.status(400).send({ message: "잘못된 요청입니다" });
  }
};