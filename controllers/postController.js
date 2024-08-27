const db = require('../models/index.js');
const { Post, Comment, Group, PostTag, Tag } = db;
const { comparePassword, hashPassword } = require('../utils/passwordUtils'); // 비밀번호 유틸리티 불러오기
const { createTags, updateTags } = require('../services/tagService.js');
const { Op, literal } = require('sequelize');
const { checkConsecutiveDays, checkPostCount, checkPostLikeCount, checkGroupLikeCount } = require('../services/badgeService.js');

const getPostDetailsById = async (postId) => {
  try {
    const post = await Post.findByPk(postId, {
      attributes: [
        'id', 
        'groupId', 
        'nickname', 
        'title', 
        'content', 
        'imageUrl', 
        'location',
        'moment',
        'isPublic',
        'likeCount',
        'createdAt'
      ]
    });

    const postData = post.toJSON();
    postData.tags = await getTagsByPostId(postId);
    postData.commentCount = await getCommentCountByPostId(postId);

    return postData;
  } catch (error) {
    throw error;
  }
};

const getTagsByPostId = async (postId) => {
  try {
    const tags = await PostTag.findAll({
      where: { postId },
      include: {
        model: Tag,
        attributes: ['name']
      },
      attributes: []
    });

    const tagNames = tags.map(postTag => postTag.Tag.name);
    return tagNames;
  } catch (error) {
    throw error;
  }
};

const getCommentCountByPostId = async (postId) => {
  try {
    const commentCount = await Comment.count({
      where: { postId }
    });
    return commentCount;
  } catch (error) {
    throw error;
  }
};

// 게시글 등록 
exports.createPost = async (req, res) => {
  const { groupId } = req.params;
  const {
    nickname,
    title,
    content,
    postPassword,
    groupPassword,
    imageUrl,
    tags,
    location,
    moment,
    isPublic
  } = req.body;

  try {
    // 필수 필드 확인
    if (!nickname || !title || !content || !postPassword || !groupPassword) {
      return res.status(400).json({ message: '잘못된 요청입니다' });
    }

    // 그룹 확인 및 비밀번호 검증
    const group = await Group.findByPk(groupId);

    if (!group) {
      return res.status(404).json({ message: '존재하지 않는 그룹입니다' });
    }

    const isGroupPasswordMatch = await comparePassword(groupPassword, group.password);
    if (!isGroupPasswordMatch) {
      return res.status(403).json({ message: '그룹 비밀번호가 틀렸습니다' });
    }

    // 게시글 비밀번호 해싱
    const hashedPostPassword = await hashPassword(postPassword);

    // 게시글 생성 및 저장
    const post = await Post.create({
      groupId,
      nickname,
      title,
      content,
      password: hashedPostPassword, // 해싱된 비밀번호 저장
      imageUrl,
      location,
      moment,
      isPublic,
      likeCount: 0
    });

    // 태그 생성
    await createTags(tags, post.id);

    // 배지 조건 확인
    await checkConsecutiveDays(groupId);
    await checkPostCount(groupId);

    const postWithDetails = await getPostDetailsById(post.id);
    // 성공 응답 반환
    return res.status(200).send(postWithDetails);
  } catch (error) {
    console.error(`게시글 등록 중 오류 발생: ${error.message}`);
    return res.status(400).json({ message: '잘못된 요청입니다' });
  }
};


// 게시글 목록 조회 
exports.getPosts = async (req, res) => {
  const { groupId } = req.params;
  const { 
    page = 1, 
    pageSize = 10, 
    sortBy = 'latest', 
    keyword = '', 
    isPublic = true 
  } = req.query;

  try {
    const group = await Group.findByPk(groupId);

    if (!group) {
      return res.status(404).send({ message: '존재하지 않습니다' });
    }

    // 페이지네이션 설정
    const limit = parseInt(pageSize, 10);
    const offset = (parseInt(page, 10) - 1) * limit;

    const sortOptions = {
      latest: [['createdAt', 'DESC']],
      mostCommented: [['commentCount', 'DESC']],
      mostLiked: [['likeCount', 'DESC']]
    };

    const { count: totalItemCount, rows: posts } = await Post.findAndCountAll({
      order: sortOptions[sortBy],
      offset,
      limit,
      attributes: [
        'id',
        'nickname',
        'title',
        'imageUrl',
        'location',
        'moment',
        'isPublic',
        'likeCount',
        [
          literal(`(
            SELECT COUNT(*)
            FROM Comments AS comment
            WHERE comment.postId = Post.id
          )`),
          'commentCount'
        ],
        'createdAt'
      ],
      include: [
        {
          model: PostTag,
          attributes: [],
          include: [
            {
              model: Tag,
              attributes: [],
              where: {
                name: {
                  [Op.like]: `${keyword}`
                }
              }
            }
          ],
          required: false
        }
      ],
      where: {
        [Op.or]: [
          { title: { [Op.like]: `%${keyword}%` } },
          { '$PostTags.postId$': { [Op.ne]: null } }
        ],
        isPublic,
        groupId
      },
      subQuery: false
    });

    const currentPage = parseInt(page);
    const totalPages = Math.ceil(totalItemCount/limit);
    const data = await Promise.all(posts.map(async (post) => {
      const tags = await getTagsByPostId(post.id);
      return { ...post.dataValues, tags };
    }));

    const response = {
      currentPage,
      totalPages,
      totalItemCount,
      data
    };

    res.send(response);
  } catch (error) {
    console.error(`게시글 목록 조회 중 오류 발생: ${error.message}`);
    return res.status(400).json({ message: '잘못된 요청입니다' });
  }
};


// 게시글 수정 
exports.updatePost = async (req, res) => {
  const { postId } = req.params;
  const { nickname, title, content, postPassword, imageUrl, tags, location, moment, isPublic } = req.body;

  try {
    // 데이터베이스에서 해당 게시글 찾기
    const post = await Post.findByPk(postId);

    if (!post) {
      return res.status(404).json({ message: '존재하지 않습니다' });
    }

    // 비밀번호 확인
    const isMatch = await comparePassword(postPassword, post.password);
    if (!isMatch) {
      return res.status(403).json({ message: '비밀번호가 틀렸습니다' });
    }

    // 게시글 내용 수정
    post.nickname = nickname;
    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;
    post.tags = tags;
    post.location = location;
    post.moment = moment;
    post.isPublic = isPublic;

    // 변경된 게시글 저장
    await post.save();

    // 변경된 태그 수정
    await updateTags(tags, postId);

    const postWithDetails = await getPostDetailsById(postId);
    // 수정된 게시글의 응답 반환
    return res.status(200).send(postWithDetails);
  } catch (error) {
    console.error(`게시글 수정 중 오류 발생: ${error.message}`);
    return res.status(400).json({ message: '잘못된 요청입니다' });
  }
};


// 게시글 삭제 
exports.deletePost = async (req, res) => {
  const { postId } = req.params;
  const { postPassword } = req.body;

  try {
    // 데이터베이스에서 해당 게시글 찾기
    const post = await Post.findByPk(postId);

    if (!post) {
      return res.status(404).json({ message: '존재하지 않습니다' });
    }

    // 비밀번호 확인
    const isMatch = await comparePassword(postPassword, post.password);
    if (!isMatch) {
      return res.status(403).json({ message: '비밀번호가 틀렸습니다' });
    }

    // 게시글 삭제
    await post.destroy();

    return res.status(200).json({ message: '게시글 삭제 성공' });
  } catch (error) {
    console.error(`게시글 삭제 중 오류 발생: ${error.message}`);
    return res.status(400).json({ message: '잘못된 요청입니다' });
  }
};


// 게시글 상세 조회 
exports.getPostById = async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findByPk(postId);

    if (!post) {
      return res.status(404).json({ message: '존재하지 않습니다' });
    }

    const postWithDetails = await getPostDetailsById(postId);

    return res.status(200).send(postWithDetails);
  } catch (error) {
    console.error(`게시글 상세 조회 중 오류 발생: ${error.message}`);
    return res.status(400).json({ message: '잘못된 요청입니다' });
  }
};


// 게시글 조회 권한 확인 
exports.verifyPostPassword = async (req, res) => {
  const { postId } = req.params;
  const { password } = req.body;

  try {
    // 데이터베이스에서 해당 게시글 찾기
    const post = await Post.findByPk(postId);

    if (!post) {
      return res.status(404).json({ message: '존재하지 않습니다' });
    }

    // 비밀번호 확인
    const isMatch = await comparePassword(password, post.password);
    if (!isMatch) {
      return res.status(401).json({ message: '비밀번호가 틀렸습니다' });
    }

    // 비밀번호가 일치할 경우 성공 메시지 반환
    return res.status(200).json({ message: '비밀번호가 확인되었습니다' });
  } catch (error) {
    console.error(`게시글 조회 권한 확인 중 오류 발생: ${error.message}`);
    return res.status(400).json({ message: '잘못된 요청입니다' });
  }
};


// 게시글 공감하기 
exports.likePost = async (req, res) => {
  const { postId } = req.params;

  try {
    // 데이터베이스에서 해당 게시글 찾기
    const post = await Post.findByPk(postId);

    if (!post) {
      return res.status(404).json({ message: '존재하지 않습니다' });
    }

    // 공감 수 증가
    post.likeCount += 1;

    // 변경된 게시글 저장
    await post.save();

    // 배지 조건 확인
    await checkPostLikeCount(postId);

    return res.status(200).json({ message: '게시글 공감하기 성공' });
  } catch (error) {
    console.error(`게시글 공감 처리 중 오류 발생: ${error.message}`);
    return res.status(500).json({ message: '서버 오류로 인해 공감하기를 처리할 수 없습니다.', error: error.message });
  }
};

// 게시글 공개 여부 확인 
exports.isPostPublic = async (req, res) => {
  const { postId } = req.params;

  try {
    // 데이터베이스에서 해당 게시글 찾기
    const post = await Post.findByPk(postId, {
      attributes: ['id', 'isPublic'] // 필요한 필드만 선택
    });

    if (!post) {
      return res.status(404).json({ message: '존재하지 않습니다' });
    }

    // 공개 여부 반환
    return res.status(200).json({
      id: post.id,
      isPublic: post.isPublic
    });
  } catch (error) {
    console.error(`게시글 공개 여부 확인 중 오류 발생: ${error.message}`);
    return res.status(500).json({ message: '서버 오류로 인해 요청을 처리할 수 없습니다.', error: error.message });
  }
};


