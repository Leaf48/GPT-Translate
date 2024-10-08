async function script() {
  // 文字が選択中か
  let isSelecting = true;

  // 選択中のテキスト
  let selectedText = "";

  // Selection Object
  let selectionRange;

  // mousedownしているときにisSelectingをtrueにする
  document.addEventListener("mousedown", () => {
    isSelecting = true;
  });

  // ボタン作成
  function createToggleButton(textNode, original, replaced) {
    // ボタン要素
    let toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.textContent = "切替";
    toggleButton.style.marginLeft = "5px";
    // クリックするとoriginalとreplacedを切り替えれる
    // textNodeのvalueを変更する
    toggleButton.onclick = function () {
      textNode.nodeValue =
        textNode.nodeValue === original ? replaced : original;
    };
    return toggleButton;
  }

  // 元のテキストと、翻訳されてテキストを引数に取る
  function replaceSelectedText(originalText, newText) {
    if (!selectionRange) return;

    // 新しい"テキスト"nodeを作成
    let newNode = document.createTextNode(newText);
    // ボタンを作成
    // 引数へテキストノードを渡す
    let toggleButton = createToggleButton(newNode, originalText, newText);
    // range内の全てのコンテンツを削除
    selectionRange.deleteContents();
    // rangeへ要素を追加
    selectionRange.insertNode(newNode);
    selectionRange.insertNode(toggleButton);

    // 新しい"レンジ"を選択する
    let newRange = document.createRange();
    // newNodeを範囲内へ追加
    newRange.selectNode(newNode);
  }

  // mouseup したときに実行
  // ボタンを押したときにでも実行される
  document.addEventListener("mouseup", function (e) {
    // 選択されている部分を取得
    const selection = window.getSelection();
    // 選択されている部分をstringで取得
    const currentSelectedText = selection.toString().trim();

    // グローバルスコープで選択部分を保存
    selectedText = selection.toString().trim();

    // icon以外がタップされた時に、アイコンを消す
    // 遅延を付けることで選択した際に誤反応を起こすのを防止する
    setTimeout(() => {
      const selection = window.getSelection();
      const icon = document.getElementById("text-replace-icon");
      const icon2 = document.getElementById("text-summ-icon");

      // タップしたtargetを使って判別
      if (
        selection.toString().trim() === "" &&
        (e.target !== icon || e.target !== icon2)
      ) {
        if (icon) {
          icon.remove();
        }
        if (icon2) {
          icon2.remove();
        }
      }
    }, 10);

    // 選択されたテキストがある時かつ選択中
    if (selectedText !== "" && isSelecting) {
      // Selection object へコピー
      selectionRange = selection.getRangeAt(0).cloneRange();

      // もし別のアイコンが表示されているのならば、削除
      var existingIcon = document.getElementById("text-replace-icon");
      var existingIcon2 = document.getElementById("text-summ-icon");
      if (existingIcon) {
        existingIcon.remove();
      }
      if (existingIcon2) {
        existingIcon2.remove();
      }

      var icon = createIcon("text-replace-icon", "⚙️", 0, e);

      // アイコンをクリックしたときに削除と関数実行
      icon.addEventListener("click", async function () {
        icon.remove();

        // ChatGPTで翻訳
        const res = await completion(
          currentSelectedText,
          "英語の場合は日本語へ,日本語の場合は英語へ翻訳してください.その他の言語はすべて日本語へ翻訳してください"
        );
        // 置き換え実行
        replaceSelectedText(currentSelectedText, res);
      });

      var summ_icon = createIcon("text-summ-icon", "⚡️", 30, e);
      summ_icon.addEventListener("click", async () => {
        summ_icon.remove();
        const res = await completion(
          currentSelectedText,
          "言語は原文と全く同じ言語を使いなさい.原文に使われているキーワードを使って文章を要約して下さい.キーワードとなる部分は必ず原文を抜き出して使用しなさい"
        );
        replaceSelectedText(currentSelectedText, res);
      });

      // 選択中をfalse
      isSelecting = false;
    }
  });
}

// アイコン作成
function createIcon(id, iconText, offset, e) {
  var icon = document.createElement("span");
  icon.id = id;
  icon.textContent = iconText; // ここでアイコンを選ぶ
  icon.style.position = "absolute";
  // e.pageでマウスカーソルの座標を取得
  icon.style.left = e.pageX + 20 + offset + "px";
  icon.style.top = e.pageY + 30 + offset + "px";
  icon.style.cursor = "pointer";
  icon.style.backgroundColor = "#FFF";
  icon.style.border = "1px solid #000";
  icon.style.padding = "2px";
  icon.style.borderRadius = "5px";
  icon.style.zIndex = `${100000 + offset}`;
  document.body.appendChild(icon);
  return icon;
}

// ChatGPTへリクエスト
async function completion(text, instruction) {
  var token = await chrome.storage.local.get("gpt_translate_token");
  token = token.gpt_translate_token;

  var headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  var apiUrl = "https://api.openai.com/v1/chat/completions";

  var body = JSON.stringify({
    model: "gpt-4o-mini",
    max_tokens: 1000,
    messages: [
      {
        role: "system",
        content: instruction,
      },
      { role: "user", content: text },
    ],
    temperature: 0.7,
  });

  // fetch
  try {
    const result = await (
      await fetch(apiUrl, { method: "POST", headers: headers, body: body })
    ).json();
    const content = result.choices[0].message.content;

    return content;
  } catch (error) {
    console.log(error);
    return "";
  }
}

window.addEventListener("load", script);
