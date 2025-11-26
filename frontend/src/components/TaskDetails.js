import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LimitedAddButton from "./LimitedAddButton"; // Load reusable limited-button component

/**
 * TaskDetails component - Responsible for:
 * - Fetching the selected task by ID
 * - Fetching list of all tasks for navigation sidebar
 * - Displaying task content: text, images, audio
 * - Managing recording logic and limits
 * - Updating and saving task
 */
const TaskDetails = () => {
  // ================================
  // Get task id from URL parameters
  // ================================
  const { id } = useParams();
  const navigate = useNavigate();

  // =======================================
  // Local component states for UI and logic
  // =======================================
  const [tasks, setTasks] = useState([]); // All tasks for sidebar
  const [task, setTask] = useState(null); // Currently selected task data
  const [loading, setLoading] = useState(true); // Show loading state
  const [recording, setRecording] = useState(false); // Recording status
  const [timeLeft, setTimeLeft] = useState(0); // countdown timer for recording
  const mediaRecorderRef = useRef(null); // Store media recorder instance
  const audioChunksRef = useRef([]); // Temporary buffer for audio chunks
  const [currentImage, setCurrentImage] = useState(0); // Which image is selected for display
  const [expandedTypes, setExpandedTypes] = useState({}); // Navigation expand/collapse
  const [expandedCats, setExpandedCats] = useState({}); // Navigation expand/collapse

  const token = localStorage.getItem("token");

  // ==========================================================
  // Fetch list of ALL tasks for navigation sidebar on load
  // ==========================================================
  useEffect(() => {
    fetch("http://localhost:5000/api/tasks", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setTasks)
      .catch(console.error);
  }, [token]);

  // ==========================================================
  // Fetch the CURRENT task by ID whenever URL id changes
  // ==========================================================
  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:5000/api/tasks/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        // If user is unauthorized, redirect to login
        if (res.status === 401) navigate("/login");
        return res.json();
      })
      .then((taskData) => setTask(taskData))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, navigate, token]);

  // Show fallback UI if still loading or task missing
  if (loading) return <p>Loading...</p>;
  if (!task) return <p>Task not found</p>;

  // ==========================================================
  // Styles for the entire layout
  // ==========================================================
  const styles = {
    container: {
      display: "flex",
      height: "100vh",
      fontFamily: "Arial, sans-serif",
    },
    left: {
      flex: 1,
      borderRight: "1px solid #ccc",
      padding: "10px",
      overflowY: "auto",
      background: "#d0e4f7",
    },
    center: {
      flex: 4,
      padding: "20px",
      overflowY: "auto",
      textAlign: "center",
      background: "#e6f2ff",
    },
    right: {
      flex: 1,
      borderLeft: "1px solid #ccc",
      padding: "10px",
      overflowY: "auto",
      background: "#d0e4f7",
    },

    // Reusable UI element styles
    section: { marginBottom: "20px" },
    btn: {
      border: "none",
      borderRadius: "4px",
      padding: "8px 16px",
      cursor: "pointer",
      margin: "5px",
    },
    btnDelete: { background: "#ff4444", color: "white" },
    btnAdd: { background: "#4CAF50", color: "white" },
    btnSave: { background: "#2196F3", color: "white" },

    textarea: {
      width: "80%",
      height: "80px",
      margin: "5px 0",
      padding: "8px",
      borderRadius: "4px",
      border: "1px solid #ccc",
    },

    // Thumbnail styling
    imageThumb: {
      width: "150px",
      height: "150px",
      objectFit: "cover",
      cursor: "pointer",
    },

    // Navigation styling
    navItem: { cursor: "pointer" },
    navType: { fontWeight: "bold", cursor: "pointer" },
    navCat: { fontStyle: "italic", cursor: "pointer", paddingLeft: "15px" },
    navTask: { cursor: "pointer", paddingLeft: "30px", padding: "2px 0" },
    highlight: { backgroundColor: "#e0f7fa" },
  };

  // ==========================================================
  // TEXT EDITING FUNCTIONS
  // ==========================================================
  const handleTextBoxChange = (index, value) => {
    // Update textbox contents and last modified timestamp
    const newTextBoxes = [...(task.textBoxes || [])];
    newTextBoxes[index] = {
      ...newTextBoxes[index],
      text: value,
      updatedAt: new Date(),
    };
    setTask({ ...task, textBoxes: newTextBoxes });
  };

  const addTextBox = () => {
    // Append new empty textbox
    const newTextBoxes = [
      ...(task.textBoxes || []),
      { text: "", createdAt: new Date(), updatedAt: new Date() },
    ];
    setTask({ ...task, textBoxes: newTextBoxes });
  };

  const deleteTextBox = (index) => {
    // Remove a specific textbox
    const newTextBoxes = [...(task.textBoxes || [])];
    newTextBoxes.splice(index, 1);
    setTask({ ...task, textBoxes: newTextBoxes });
  };

  // ==========================================================
  // IMAGE UPLOAD AND MANAGEMENT
  // ==========================================================

  const handleAddImage = async (e) => {
    const files = Array.from(e.target.files).slice(0, 3); // Limit to 3 images
    if (!files.length) return;

    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${task._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const updatedTask = await res.json();
      setTask(updatedTask); // Update task state with new images
      setCurrentImage(0); // Reset current displayed image to first
    } catch (err) {
      console.error(err);
      alert("图片上传失败：" + err.message);
    }
  };

  /**
   * Delete a single image by index
   * Updates state and current image pointer
   */
  const deleteImage = async (index) => {
    if (!window.confirm("确定删除这张图片吗？")) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/tasks/${task._id}/image/${index}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setTask({ ...task, imagePaths: data.imagePaths });
      setCurrentImage((prev) =>
        Math.min(prev, (data.imagePaths || []).length - 1)
      );
    } catch (err) {
      console.error(err);
      alert("删除失败：" + err.message);
    }
  };

  // Navigate between images
  const prevImage = () => setCurrentImage((prev) => Math.max(prev - 1, 0));
  const nextImage = () =>
    setCurrentImage((prev) =>
      Math.min(prev + 1, (task.imagePaths?.length || 1) - 1)
    );

  // ==========================================================
  // AUDIO RECORDING LOGIC
  // ==========================================================

  /**
   * Start recording audio using MediaRecorder API
   * Enforces max 3 recordings
   * Provides 30s countdown
   */
  const startRecording = async () => {
    if (!navigator.mediaDevices) return alert("浏览器不支持录音");
    if ((task.audioPaths?.length || 0) >= 3)
      return alert("最多只能保存3条录音");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Collect audio chunks while recording
      mediaRecorder.ondataavailable = (e) =>
        audioChunksRef.current.push(e.data);

      // When recording stops, upload audio to server
      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audios", blob);

        try {
          const res = await fetch(
            `http://localhost:5000/api/tasks/${task._id}`,
            {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}` },
              body: formData,
            }
          );
          const updatedTask = await res.json();
          setTask(updatedTask);
        } catch (err) {
          console.error(err);
          alert("录音上传失败：" + err.message);
        }

        setRecording(false);
        setTimeLeft(0);
      };

      mediaRecorder.start();
      setRecording(true);

      // Start 30-second countdown
      let duration = 30;
      setTimeLeft(duration);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("无法访问麦克风:", err);
      alert("无法访问麦克风");
    }
  };

  /**
   * Stop the current recording and release microphone
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
  };

  /**
   * Delete a single audio recording by index
   */
  const deleteAudio = async (index) => {
    if (!window.confirm("确定删除这条音频吗？")) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/tasks/${task._id}/audio/${index}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) setTask((prev) => ({ ...prev, audioPaths: data.audioPaths }));
      else alert(data.message || "删除失败");
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================================
  // SAVE TASK
  // ==========================================================
  const saveTask = async () => {
    const formData = new FormData();
    formData.append("title", task.title || "");
    formData.append("masteryLevel", task.masteryLevel || 0);
    formData.append("showNavigation", task.showNavigation || false);
    formData.append("textBoxes", JSON.stringify(task.textBoxes || []));
    formData.append("taskNotes", JSON.stringify(task.taskNotes || []));
    formData.append(
      "highlightNotes",
      JSON.stringify(task.highlightNotes || [])
    );

    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${task._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const updatedTask = await res.json();
      setTask(updatedTask);
      alert("保存成功！");
    } catch (err) {
      console.error(err);
      alert("保存失败：" + err.message);
    }
  };

  // ==========================================================
  // NAVIGATION TREE CONSTRUCTION (LEFT PANEL)
  // ==========================================================
  const taskTree = tasks.reduce((acc, t) => {
    const typeName = t.taskType?.name || "未知类型";
    const catName = t.category?.name || "未知类别";
    if (!acc[typeName]) acc[typeName] = {};
    if (!acc[typeName][catName]) acc[typeName][catName] = [];
    acc[typeName][catName].push(t);
    return acc;
  }, {});

  /**
   * Render sidebar navigation tree with collapsible types/categories
   */
  const renderTree = () =>
    Object.entries(taskTree).map(([type, cats]) => {
      const isTypeExpanded = expandedTypes[type];
      return (
        <div key={type}>
          <div
            style={styles.navType}
            onClick={() =>
              setExpandedTypes({ ...expandedTypes, [type]: !isTypeExpanded })
            }
          >
            {isTypeExpanded ? "▼" : "▶"} {type}
          </div>
          {isTypeExpanded &&
            Object.entries(cats).map(([cat, catTasks]) => {
              const isCatExpanded = expandedCats[cat];
              return (
                <div key={cat}>
                  <div
                    style={styles.navCat}
                    onClick={() =>
                      setExpandedCats({
                        ...expandedCats,
                        [cat]: !isCatExpanded,
                      })
                    }
                  >
                    {isCatExpanded ? "▼" : "▶"} {cat}
                  </div>
                  {isCatExpanded &&
                    catTasks.map((t) => (
                      <div
                        key={t._id}
                        style={{
                          ...styles.navTask,
                          ...(t._id === task._id ? styles.highlight : {}),
                        }}
                        onClick={() => navigate(`/task/${t._id}`)}
                      >
                        {t.title}
                      </div>
                    ))}
                </div>
              );
            })}
        </div>
      );
    });

  const note = task?.taskNotes?.join("\n") || "";
  const textLength =
    task?.textBoxes?.reduce((acc, tb) => acc + (tb.text?.length || 0), 0) || 0;

  // ==========================================================
  // MAIN RENDER
  // ==========================================================
  return (
    <div style={styles.container}>
      {/* Left navigation */}
      <div style={styles.left}>
        <h3>Task Navigation</h3>
        {renderTree()}
      </div>

      {/* Center content */}
      <div style={styles.center}>
        <h2>{task.title}</h2>

        {/* AUDIO SECTION */}
        <div style={styles.section}>
          <h3>Audio Recording ({task.audioPaths?.length || 0}/3)</h3>
          {task.audioPaths?.map((audio, i) => (
            <div key={i} style={styles.audioBox}>
              <audio controls src={`http://localhost:5000${audio}`} />
              <br />
              <LimitedAddButton
                currentCount={0}
                maxCount={999}
                onClick={() => deleteAudio(i)}
                label="🗑️ Delete Recording"
                btnStyle={{ background: "#ff4444" }}
              />
            </div>
          ))}
          {recording ? (
            <LimitedAddButton
              currentCount={0}
              maxCount={999}
              onClick={stopRecording}
              label={`⏹️ Stop Recording (${timeLeft}s)`}
              btnStyle={{ background: "#ff4444", marginRight: 10 }}
            />
          ) : (
            <LimitedAddButton
              currentCount={task.audioPaths?.length || 0}
              maxCount={3}
              onClick={startRecording}
              label="🎤 Start Recording"
            />
          )}
        </div>

        {/* IMAGE SECTION */}
        <div style={styles.section}>
          <h3>Image</h3>
          {(task.imagePaths || []).length > 0 && (
            <div style={{ textAlign: "center", marginBottom: 15 }}>
              <img
                src={`http://localhost:5000${task.imagePaths[currentImage]}`}
                alt=""
                style={{ width: 300, borderRadius: 8 }}
              />
            </div>
          )}
          {/* Thumbnail images */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 10,
              marginBottom: 10,
            }}
          >
            {(task.imagePaths || []).map((img, i) => (
              <img
                key={i}
                src={`http://localhost:5000${img}`}
                alt=""
                style={{
                  width: 50,
                  height: 50,
                  objectFit: "cover",
                  cursor: "pointer",
                  borderRadius: 4,
                  border:
                    i === currentImage ? "2px solid #2196F3" : "1px solid #ccc",
                }}
                onClick={() => setCurrentImage(i)}
              />
            ))}
          </div>

          {/* Delete current image button */}
          {(task.imagePaths || []).length > 0 && (
            <button
              style={{ ...styles.btn, ...styles.btnDelete, marginBottom: 10 }}
              onClick={() => deleteImage(currentImage)}
            >
              🗑️ Delete Image
            </button>
          )}

          {/* Add image button (only if less than 3 images) */}
          {(task.imagePaths?.length || 0) < 3 && (
            <>
              <button
                style={{ ...styles.btn, ...styles.btnAdd }}
                onClick={() =>
                  document.getElementById("add-image-input").click()
                }
              >
                ➕ Add Image
              </button>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleAddImage}
                style={{ display: "none" }}
                id="add-image-input"
              />
            </>
          )}
        </div>

        {/* TEXT BOX SECTION */}
        <div style={styles.section}>
          <h3>Text Content</h3>
          {(task.textBoxes || []).map((tb, i) => (
            <div key={i} style={{ margin: "10px 0" }}>
              <textarea
                style={styles.textarea}
                value={tb.text || ""}
                onChange={(e) => handleTextBoxChange(i, e.target.value)}
                placeholder="Input the text..."
              />
              <LimitedAddButton
                currentCount={0}
                maxCount={999}
                onClick={() => deleteTextBox(i)}
                label="🗑️ Delete"
                btnStyle={{ background: "#ff4444" }}
              />
            </div>
          ))}
          <LimitedAddButton
            currentCount={task.textBoxes?.length || 0}
            maxCount={3}
            onClick={addTextBox}
            label="➕ Add Text"
          />
        </div>

        {/* SAVE BUTTON */}
        <div style={styles.section}>
          <LimitedAddButton
            currentCount={0}
            maxCount={999}
            onClick={saveTask}
            label="💾 Save Text"
            btnStyle={{ background: "#2196F3" }}
          />
        </div>
      </div>

      {/* RIGHT INFORMATION PANEL */}
      <div style={styles.right}>
        <h3>Task Information</h3>
        <p>Master Level: {task.masteryLevel || 0}</p>
        <p>Text Length: {textLength}</p>
        <p>Note: {note}</p>
      </div>
    </div>
  );
};

export default TaskDetails;
