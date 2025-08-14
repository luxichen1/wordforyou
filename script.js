// 引入单词库JSON
let wordBank = []
// 当前关卡的单词
let nowWord = null
// 用于显示的单词词组/下划线
let displayWord = []
// 用户输入的字母
let userInput = []
// 提交本关答案，默认为false
let answer = false
// 存储当前单词的释义
let currentDefinition = ''
// 新增：记录用户输入字母的位置索引（区分系统提示）
let userInputIndices = [];

// 引入单词库JSON，我先用CET6试水
function loadWord() {
  fetch('CET6.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP错误，状态码: ${response.status}`);
      }
      return response.json()
    })
    .then(data => {
      wordBank = data;
      console.log(`单词库加载成功，共${wordBank.length}个单词`);
    })
    .catch(error => {
      // 捕获所有可能的错误并显示
      console.error('单词库加载失败:', error.message);
    });
  // 报错这段是借助了AI，因为我忘记了要捕获错误，唉

}
// 调用加载函数
loadWord();
gameBegin()

function updateWordDisplay() {
  const wordHead = document.querySelector('.word-head');
  // 将 displayWord 数组转为字符串显示（比如 ['A', '_', 'T'] → "A _ T"）
  wordHead.textContent = displayWord.join(' ');
  document.querySelector('.definition').textContent = currentDefinition; // 显示释义
}

function resetGame() {
  // 重置基础状态
  answer = false;
  userInput = [];
  displayWord = [];
  userInputIndices = [];

  // 重新选单词（确保从有效单词库中选择）
  if (wordBank.length === 0) {
    console.error("单词库为空，无法选择单词");
    return; // 避免后续错误
  }
  const randomIndex = Math.floor(Math.random() * wordBank.length);
  const wordObj = wordBank[randomIndex];
  // 确保单词提取正确（关键：验证word字段存在）
  if (!wordObj || !wordObj.word) {
    console.error("单词数据格式错误，缺少word字段", wordObj);
    return;
  }
  nowWord = wordObj.word.toLowerCase(); // 确定当前正确单词


  // 重新设置释义
  currentDefinition = wordObj.translations && wordObj.translations.length > 0
    ? `${wordObj.translations[0].type} ${wordObj.translations[0].translation}`
    : "无释义";


  // 关键修复：强制用当前nowWord生成显示数组（提示字母）
  displayWord = initializeDisplayWord(nowWord);
  // 立即更新界面，确保显示正确
  updateWordDisplay();
}

function checkAnswer() {
  // 先判断答案是否正确（获取结果）
  const isCorrect = displayWord.join('') === nowWord;
  const alertsElement = document.querySelector('.alerts');
  const tips = document.querySelector('.alerts .tips');
  const words = document.querySelector('.alerts .words'); // 修正变量名和选择器
  const nextBtn = document.querySelector('.next');
  const overBtn = document.querySelector('.over');

  // 确保按钮显示
  nextBtn.classList.remove('btn-hide');
  overBtn.classList.remove('btn-hide');
  // 移除加载提示样式
  tips.className = 'tips';
  words.className = 'words';

  setTimeout(function () {
    if (isCorrect) {
      answer = true;
      tips.innerHTML = `你回答对了<br>正确的单词拼写是：`;
      words.innerHTML = `<strong>${nowWord}</strong>`; // 修正变量名
    } else {
      answer = true; // 关键：标记弹窗已显示
      tips.innerHTML = `你说错啦~<br>正确的单词拼写是：`;
      words.innerHTML = `"<strong>${nowWord}</strong>"`; // 修正变量名
    }

    // 显示提示框
    alertsElement.style.display = 'block';
  }, 500); // 500 毫秒 = 0.5 秒
}

// 替换原有的"下一关"按钮事件监听
document.querySelector('.next').addEventListener('click', function () {
  const alertsElement = document.querySelector('.alerts');

  // 1. 隐藏提示框
  alertsElement.style.display = 'none';

  // 2. 直接重置游戏（不再有动画逻辑）
  resetGame();
});

// 添加事件监听事件
document.querySelector('.over').addEventListener('click', function () {
  // 关闭当前网页窗口
  window.close();
});

// 修改初始化显示数组的逻辑，添加随机显示字母的功能
function initializeDisplayWord(word) {
  // 新增校验：确保传入的单词有效
  if (!word || typeof word !== 'string') {
    console.error("无效的单词参数，无法生成显示数组", word);
    return []; // 避免后续错误
  }

  // 先全部初始化为下划线
  const display = Array(word.length).fill('_');

  // 计算要显示的字母数量（可以根据单词长度动态调整）
  // 例如：单词长度<=4显示1个，5-7显示2个，更长显示3个
  let revealCount;
  if (word.length <= 4) {
    revealCount = 1;
  } else if (word.length <= 7) {
    revealCount = 2;
  } else {
    revealCount = 3;
  }

  // 确保不会显示超过单词长度的字母（针对极短单词）
  revealCount = Math.min(revealCount, word.length);

  // 随机选择位置显示真实字母（修复随机索引生成逻辑）
  const revealedIndices = new Set();
  while (revealedIndices.size < revealCount) {
    // 关键修复：生成0到单词长度-1之间的随机索引
    const randomIndex = Math.floor(Math.random() * word.length);
    revealedIndices.add(randomIndex);
  }
  // 填充提示字母（强制使用当前单词的字母）
  revealedIndices.forEach(index => {
    // 新增校验：确保索引在有效范围内
    if (index >= 0 && index < word.length) {
      display[index] = word[index]; // 从当前单词取字母，确保与nowWord一致
    }
  });
  return display;
}

function gameBegin() {
  // 先加载单词库，每0.1秒检查一遍单词库里是否有词
  if (wordBank.length === 0) {
    setTimeout(gameBegin, 100)
    return
  }

  // 选择要操纵的div--choose
  const parent = document.querySelector('.choose')
  // 设置循环次数，获取小div
  const count = 26

  parent.innerHTML = '';

  // 重置游戏状态
  answer = false;
  userInput = [];
  displayWord = [];


  for (let i = 0; i < count; i++) {
    // 创建div
    const letterBox = document.createElement('button')
    letterBox.className = 'letter'
    letterBox.textContent = String.fromCharCode(97 + i)      // 按钮上的字母为a-z，感觉还小写好看
    // 添加dataset.letter属性，值为div里的字母
    letterBox.dataset.letter = letterBox.textContent;
    // 把div放进大div的后面--用appendChild
    parent.appendChild(letterBox)

    // 绑定点击事件
    letterBox.addEventListener('click', function () {
      if (answer) return; // 已答对则不处理

      // 查找第一个下划线位置
      const emptyIndex = displayWord.indexOf('_');
      if (emptyIndex !== -1) {
        // 填充字母时，记录用户输入的位置
        displayWord[emptyIndex] = letterBox.textContent;
        userInput.push(letterBox.textContent);
        userInputIndices.push(emptyIndex); // 关键：记录当前输入的索引位置
        updateWordDisplay();

        // 检查是否填满所有字母
        if (!displayWord.includes('_')) {
          checkAnswer();
        }
      }
    })
  }

  // 首次初始化单词（后续下一关由 resetGame 处理）
  resetGame();

  //输入响应
  document.addEventListener('keydown', keyPress)
  function keyPress(e) {
    if (answer) {
      if (e.key === 'Enter') {
        // 触发下一关按钮点击事件
        document.querySelector('.next').click();
        return; // 阻止事件继续传播
      }
      return
    }
    if (e.key === 'Backspace') {
      const lastUserIndex = userInputIndices.pop(); // 移除并返回最后一个用户输入的索引
      if (lastUserIndex !== undefined) { // 确保有用户输入可删除
        displayWord[lastUserIndex] = '_'; // 只恢复用户输入的位置为下划线
        userInput.pop(); // 同步删除用户输入的字母记录
        updateWordDisplay();
      }
    }
    // 用正则表达式判断按下的按键是不是a-z，如果是的话就输入
    else if (/^[a-z]$/.test(e.key.toLowerCase())) {
      const inputLetter = e.key.toLowerCase()

      // 找到对应的字母按钮（通过 data-letter 属性）
      const targetButton = document.querySelector(`.letter[data-letter="${inputLetter}"]`);

      if (targetButton) {
        // 模拟鼠标移入：添加 hover 样式（或直接复用 CSS 的 hover 逻辑）
        targetButton.classList.add('keyboard-hover');
        // 短暂延迟后移除样式，模拟鼠标移出
        setTimeout(() => {
          targetButton.classList.remove('keyboard-hover');
        }, 200); // 200ms 后恢复，可根据需要调整
      }

      const emptyIndex = displayWord.indexOf('_')
      if (emptyIndex !== -1) { // 有位置可填充
        // 填充字母（和点击按钮逻辑一致）
        displayWord[emptyIndex] = inputLetter;
        userInput.push(inputLetter);
        userInputIndices.push(emptyIndex); // 记录用户输入位置
        updateWordDisplay();

        // 检查是否填满所有字母
        if (!displayWord.includes('_')) {
          checkAnswer();
        }
      }

    }
  }

}
const icondiv = document.querySelector('.icondiv');
const dropdownMenu = document.querySelector('.dropdown-menu');
let closeTimer;

// 点击图标切换菜单
icondiv.addEventListener('click', (e) => {
  e.stopPropagation();
  clearTimeout(closeTimer);
  dropdownMenu.classList.toggle('show');
  icondiv.classList.toggle('show');
});

// 同时修改关闭菜单的相关逻辑，确保图标状态同步
document.addEventListener('click', () => {
  dropdownMenu.classList.remove('show');
  icondiv.classList.remove('show'); // 同步移除show类
});

// 鼠标离开后3秒关闭
function startCloseTimer() {
  if (dropdownMenu.classList.contains('show')) {
    closeTimer = setTimeout(() => {
      dropdownMenu.classList.remove('show');
    }, 3000);
  }
}

// 点击其他区域关闭
document.addEventListener('click', () => {
  dropdownMenu.classList.remove('show');
});

// 鼠标进入时取消关闭计时器
function resetCloseTimer() {
  clearTimeout(closeTimer);
}

// 绑定鼠标事件
icondiv.addEventListener('mouseleave', startCloseTimer);
dropdownMenu.addEventListener('mouseleave', startCloseTimer);
icondiv.addEventListener('mouseenter', resetCloseTimer);
dropdownMenu.addEventListener('mouseenter', resetCloseTimer);

// 点击其他区域关闭
document.addEventListener('click', () => {
  dropdownMenu.classList.remove('show');
});

// 当前使用的单词库标识
let currentWordBank = 'CET6';

// 绑定切换单词库事件
document.getElementById('switchWordBank').addEventListener('click', function () {
  // 切换单词库标识
  currentWordBank = currentWordBank === 'CET6' ? 'PGEE' : 'CET6';

  // 重新加载对应单词库
  loadSpecificWordBank(currentWordBank);

  // 关闭下拉菜单
  dropdownMenu.classList.remove('show');
});

// 加载指定的单词库
function loadSpecificWordBank(bankName) {
  // 清空现有单词库
  wordBank = [];

  // 显示加载提示
  const tips = document.querySelector('.alerts .tips');
  const words = document.querySelector('.alerts .words');
  const alertsElement = document.querySelector('.alerts');
  const nextBtn = document.querySelector('.next');
  const overBtn = document.querySelector('.over');

  // 隐藏按钮
  nextBtn.classList.add('btn-hide');
  overBtn.classList.add('btn-hide');

  // 添加加载提示样式
  tips.className = 'tips loading-tips';
  words.className = 'words loading-tips';


  tips.innerHTML = '正在加载单词库...';
  words.innerHTML = `请稍候，正在切换到${bankName}单词库`;
  alertsElement.style.display = 'block';

  // 根据选择加载不同的单词库
  fetch(`${bankName}.json`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`单词库加载失败，状态码: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      wordBank = data;
      console.log(`${bankName}单词库加载成功，共${wordBank.length}个单词`);
      // 关键修改：延长提示显示时间（3000毫秒 = 3秒，可调整）
      setTimeout(() => {
        alertsElement.style.display = 'none';
        // 恢复按钮显示
        nextBtn.classList.remove('btn-hide');
        overBtn.classList.remove('btn-hide');
        // 移除加载提示样式
        tips.className = 'tips';
        words.className = 'words';
        resetGame(); // 隐藏提示后再重置游戏
      }, 1000); // 时间可按需修改（如5000为5秒）
    })
    .catch(error => {
      console.error('单词库加载失败:', error.message);
      tips.innerHTML = '加载失败';
      words.innerHTML = `无法加载${bankName}单词库，请检查文件是否存在`;

      // 失败提示也延长显示时间
      setTimeout(() => {
        alertsElement.style.display = 'none';
        nextBtn.classList.remove('btn-hide');
        overBtn.classList.remove('btn-hide');
        // 移除加载提示样式
        tips.className = 'tips';
        words.className = 'words';
      }, 3000);
    })

}
// 修改初始加载函数，使用通用加载函数
function loadWord() {
  loadSpecificWordBank('CET6'); // 默认加载CET6
}

// 获取元素
const gameSettings = document.querySelector('.dropdown-item:nth-child(2)');
const settingsWindow = document.querySelector('.settings-window');
const closeSettings = document.querySelector('.close-settings');
const skinChange = document.querySelector('.settings-item:nth-child(1)');
const endGameFromSettings = document.querySelector('.settings-item:nth-child(2)');

// 点击游戏设置显示窗口
gameSettings.addEventListener('click', (e) => {
  e.stopPropagation();
  settingsWindow.classList.add('show');
  dropdownMenu.classList.remove('show'); // 关闭下拉菜单
});

// 关闭设置窗口
closeSettings.addEventListener('click', () => {
  settingsWindow.classList.remove('show');
});

// 点击其他区域关闭设置窗口
document.addEventListener('click', (e) => {
  if (!settingsWindow.contains(e.target) && e.target !== gameSettings) {
    settingsWindow.classList.remove('show');
  }
});

// 结束游戏功能（复用现有逻辑）
endGameFromSettings.addEventListener('click', () => {
  window.close();
});

// 换肤功能（这里只是示例，你可以根据需要实现具体换肤逻辑）
skinChange.addEventListener('click', () => {
  alert('换肤功能即将上线，敬请期待！');
  // 可以在这里添加实际的换肤逻辑
});

// 获取关于相关元素
const aboutItem = document.querySelector('.dropdown-item:nth-child(3)');
const aboutWindow = document.querySelector('.about-window');
const closeAbout = document.querySelector('.close-about');

// 点击关于选项显示弹窗
aboutItem.addEventListener('click', (e) => {
  e.stopPropagation();
  aboutWindow.classList.add('show');
  dropdownMenu.classList.remove('show'); // 关闭下拉菜单
});

// 关闭关于弹窗
closeAbout.addEventListener('click', () => {
  aboutWindow.classList.remove('show');
});

// 点击其他区域关闭关于弹窗
document.addEventListener('click', (e) => {
  if (!aboutWindow.contains(e.target) && e.target !== aboutItem) {
    aboutWindow.classList.remove('show');
  }
});