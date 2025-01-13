import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { Header } from "../components/Header";
import { url } from "../const";
import "./home.css";

export const Home = () => {
  const [isDoneDisplay, setIsDoneDisplay] = useState("todo"); // todo->未完了 done->完了
  const [lists, setLists] = useState([]);
  const [selectListId, setSelectListId] = useState();
  const [tasks, setTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [cookies] = useCookies();

  const handleIsDoneDisplayChange = (e) => setIsDoneDisplay(e.target.value);

  const handleKeyDown = (e) => {
    const currentIndex = lists.findIndex((list) => list.id === selectListId);

    if (e.key === "ArrowDown") {
      // 次のリストに移動
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % lists.length;
      setSelectListId(lists[nextIndex].id);
    } else if (e.key === "ArrowUp") {
      // 前のリストに移動
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + lists.length) % lists.length;
      setSelectListId(lists[prevIndex].id);
    } else if (e.key === "Enter") {
      // 選択されたリストを確定
      e.preventDefault();
      handleSelectList(selectListId);
    }
  };

  useEffect(() => {
    axios
      .get(`${url}/lists`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setLists(res.data);
      })
      .catch((err) => {
        setErrorMessage(`リストの取得に失敗しました。${err}`);
      });
  }, []);

  useEffect(() => {
    const listId = lists[0]?.id;
    if (typeof listId !== "undefined") {
      setSelectListId(listId);
      axios
        .get(`${url}/lists/${listId}/tasks`, {
          headers: {
            authorization: `Bearer ${cookies.token}`,
          },
        })
        .then((res) => {
          setTasks(res.data.tasks);
        })
        .catch((err) => {
          setErrorMessage(`タスクの取得に失敗しました。${err}`);
        });
    }
  }, [lists]);

  const handleSelectList = (id) => {
    setSelectListId(id);
    axios
      .get(`${url}/lists/${id}/tasks`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setTasks(res.data.tasks);
      })
      .catch((err) => {
        setErrorMessage(`タスクの取得に失敗しました。${err}`);
      });
  };

  return (
    <div>
      <Header />
      <main className="taskList">
        <p className="error-message">{errorMessage}</p>
        <div>
          <div className="list-header">
            <h2>リスト一覧</h2>
            <div className="list-menu">
              <p>
                <Link to="/list/new">リスト新規作成</Link>
              </p>
              <p>
                <Link to={`/lists/${selectListId}/edit`}>選択中のリストを編集</Link>
              </p>
            </div>
          </div>
          {/* リストをリストボックスとして扱う */}
          <ul
            className="list-tab"
            role="listbox"
            aria-label="リストの選択"
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            {lists.map((list) => {
              const isActive = list.id === selectListId;
              return (
                <li
                  key={list.id}
                  className={`list-tab-item ${isActive ? "active" : ""}`}
                  role="option"
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1} // アクティブな項目のみフォーカス可能
                  onClick={() => handleSelectList(list.id)}
                >
                  {list.title}
                </li>
              );
            })}
          </ul>
          <div className="tasks">
            <div className="tasks-header">
              <h2>タスク一覧</h2>
              <Link to="/task/new">タスク新規作成</Link>
            </div>
            <div className="display-select-wrapper">
              <select
                onChange={handleIsDoneDisplayChange}
                className="display-select"
                aria-label="タスクの表示切り替え"
              >
                <option value="todo">未完了</option>
                <option value="done">完了</option>
              </select>
            </div>
            <Tasks tasks={tasks} selectListId={selectListId} isDoneDisplay={isDoneDisplay} />
          </div>
        </div>
      </main>
    </div>
  );
};

// 表示するタスク
const Tasks = (props) => {
  const { tasks, selectListId, isDoneDisplay } = props;
  const formatDate = (datestring) => {
    const date = new Date(datestring);
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const remainingDate = (datestring) => {
    const date = new Date(datestring);
    const now = new Date();
    const diff = date - now;
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const diffMinutes = Math.floor((diff / (1000 * 60)) % 60);
    if (diff > 0) {
      return `${diffDays}日 ${String(diffHours).padStart(2, "0")}時間 ${String(diffMinutes).padStart(2, "0")}分`;
    } else {
      return "期限切れ";
    }
  };
  if (tasks === null) return <></>;

  if (isDoneDisplay === "done") {
    return (
      <ul>
        {tasks
          .filter((task) => task.done)
          .map((task) => (
            <li key={task.id} className="task-item">
              <Link to={`/lists/${selectListId}/tasks/${task.id}`} className="task-item-link">
                {task.title}
                <br />
                {task.done ? "完了" : "未完了"}
                <br />
                {new Date(task.limit).toLocaleString()}
              </Link>
            </li>
          ))}
      </ul>
    );
  }

  return (
    <ul>
      {tasks
        .filter((task) => !task.done)
        .map((task) => (
          <li key={task.id} className="task-item">
            <Link to={`/lists/${selectListId}/tasks/${task.id}`} className="task-item-link">
              {task.title}
              <br />
              {task.done ? "完了" : "未完了"}
              <br />
              <strong>期限日時: </strong>
              {formatDate(task.limit)}
              <br />
              <strong>残り日時: </strong>
              {remainingDate(task.limit)}
            </Link>
          </li>
        ))}
    </ul>
  );
};
