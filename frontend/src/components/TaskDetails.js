import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LimitedAddButton from "./LimitedAddButton";
//import GrammarTextIntegration from "./GrammarTextIntegration";
import "../App.css"; // style

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [expandedTypes, setExpandedTypes] = useState({});
  const [expandedCats, setExpandedCats] = useState({});

  // New states for level selector and panels
  const [showGrammarHistory, setShowGrammarHistory] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [newNote, setNewNote] = useState("");

  // Auto-save states
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  // Reading window state
  const [readingWindow, setReadingWindow] = useState({
    isOpen: false,
    content: "",
    title: "",
  });

  // Display control states
  const [showImages, setShowImages] = useState(true);
  const [showText, setShowText] = useState(true);

  // Editing states for text boxes
  const [editingStates, setEditingStates] = useState({});

  const token = localStorage.getItem("token");

  // ==========================================================
  // NEW FUNCTIONS FOR LEVEL SELECTOR AND PANELS
  // ==========================================================
  const handleLevelChange = async (level) => {
    const updatedTask = {
      ...task,
      masteryLevel: level,
    };
    setTask(updatedTask);

    try {
      await fetch(`http://localhost:5000/api/tasks/${task._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          masteryLevel: level,
        }),
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to update level:", error);
    }
  };

  const getLevelDescription = (level) => {
    const descriptions = {
      0: "Beginner - Just starting",
      1: "Basic - Basic expressions",
      2: "Intermediate - Fluent communication",
      3: "Proficient - Complex scenarios",
      4: "Advanced - Near native level",
    };
    return descriptions[level] || "";
  };

  const addNewNote = () => {
    if (!newNote.trim()) return;

    const updatedTask = {
      ...task,
      highlightNotes: [...(task.highlightNotes || []), newNote],
    };
    setTask(updatedTask);
    setNewNote("");

    saveNoteToDatabase([...(task.highlightNotes || []), newNote]);
  };

  const saveNoteToDatabase = async (notes) => {
    try {
      await fetch(`http://localhost:5000/api/tasks/${task._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          highlightNotes: notes,
        }),
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save notes:", error);
    }
  };

  // ==========================================================
  // DISPLAY CONTROL FUNCTIONS
  // ==========================================================
  const toggleImages = () => {
    setShowImages(!showImages);
  };

  const toggleText = () => {
    setShowText(!showText);
  };

  // ==========================================================
  // READING WINDOW FUNCTIONS
  // ==========================================================
  const openReadingWindow = (content, version = 1) => {
    setReadingWindow({
      isOpen: true,
      content: content || "No content",
      title: `Text Version ${version}`,
    });
  };

  const closeReadingWindow = () => {
    setReadingWindow({
      isOpen: false,
      content: "",
      title: "",
    });
  };

  // ==========================================================
  // TEXT EDITING FUNCTIONS
  // ==========================================================
  const toggleTextEditMode = (index) => {
    setEditingStates((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const saveAndExitEdit = (index) => {
    setEditingStates((prev) => ({
      ...prev,
      [index]: false,
    }));
  };

  const handleTextBoxChange = (index, value) => {
    const newTextBoxes = [...(task.textBoxes || [])];
    newTextBoxes[index] = {
      ...newTextBoxes[index],
      text: value,
      updatedAt: new Date(),
    };

    const updatedTask = { ...task, textBoxes: newTextBoxes };
    setTask(updatedTask);

    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    const timer = setTimeout(() => {
      autoSaveTask();
    }, 2000);

    setAutoSaveTimer(timer);
  };

  // ==========================================================
  // GRAMMAR FEEDBACK HANDLER
  // ==========================================================
  const handleGrammarResults = async (correctedText, suggestions) => {
    const timestamp = new Date().toLocaleString("en-US");
    const summary = `Found ${suggestions.length} grammar issues`;

    const newFeedback = `Grammar Check Results - ${timestamp}\n${summary}\n\nCorrected Text:\n${correctedText}\n\nDetailed Suggestions:\n${suggestions
      .map((s) => `• ${s.message}: "${s.original}" → "${s.corrected}"`)
      .join("\n")}`;

    const updatedTask = {
      ...task,
      grammarFeedback: [...(task.grammarFeedback || []), newFeedback],
    };
    setTask(updatedTask);

    try {
      await fetch(`http://localhost:5000/api/tasks/${task._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          grammarFeedback: [...(task.grammarFeedback || []), newFeedback],
        }),
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save grammar feedback:", error);
      alert("Failed to save grammar feedback");
    }
  };

  // ==========================================================
  // CALCULATE WORDS AND SENTENCES FOR A SINGLE TEXT
  // ==========================================================
  const calculateTextStats = useCallback((text) => {
    if (!text || text.trim() === "") {
      return { words: 0, sentences: 0 };
    }

    const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    const sentences = text
      .split(/[.!?]+/)
      .filter((sentence) => sentence.trim().length > 0);

    return {
      words: words.length,
      sentences: sentences.length,
    };
  }, []);

  // ==========================================================
  // AUTO-SAVE FUNCTIONALITY
  // ==========================================================
  const autoSaveTask = useCallback(async () => {
    if (!task || !task._id) return;

    try {
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
      formData.append(
        "grammarFeedback",
        JSON.stringify(task.grammarFeedback || [])
      );

      const res = await fetch(`http://localhost:5000/api/tasks/${task._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const updatedTask = await res.json();
        setLastSaved(new Date());
        console.log("Auto-save successful");
      }
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  }, [task, token]);

  // ==========================================================
  // MANUAL SAVE FUNCTION
  // ==========================================================
  const manualSaveTask = async () => {
    if (!task || !task._id) return;

    try {
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
      formData.append(
        "grammarFeedback",
        JSON.stringify(task.grammarFeedback || [])
      );

      const res = await fetch(`http://localhost:5000/api/tasks/${task._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const updatedTask = await res.json();
        setLastSaved(new Date());
        alert("Task saved successfully!");
      }
    } catch (err) {
      console.error("Manual save failed:", err);
      alert("Save failed: " + err.message);
    }
  };

  // ==========================================================
  // CLEANUP TIMER ON COMPONENT UNMOUNT
  // ==========================================================
  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [autoSaveTimer]);

  // ==========================================================
  // AUTO-SAVE WHEN COMPONENT UNMOUNTS (FINAL SAVE)
  // ==========================================================
  useEffect(() => {
    return () => {
      if (task && task._id) {
        autoSaveTask();
      }
    };
  }, [task, autoSaveTask]);

  // ==========================================================
  // FETCH TASKS AND CURRENT TASK
  // ==========================================================
  useEffect(() => {
    fetch("http://localhost:5000/api/tasks", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setTasks)
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:5000/api/tasks/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) navigate("/login");
        return res.json();
      })
      .then((taskData) => {
        setTask(taskData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, navigate, token]);

  if (loading) return <p>Loading...</p>;
  if (!task) return <p>Task not found</p>;

  // ==========================================================
  // INTEGRATED GRAMMAR CHECK FUNCTIONS
  // ==========================================================
  const handleIntegratedGrammarCheck = async (textBoxIndex, text) => {
    if (!text?.trim()) {
      alert("Please enter text to check");
      return;
    }

    try {
      if (!editingStates[textBoxIndex]) {
        toggleTextEditMode(textBoxIndex);
      }

      const response = await fetch("http://localhost:5000/api/grammar-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          language: "fr",
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Grammar check service unavailable");
      }

      const grammarResults = processGrammarResults(data.data);
      const newTextBoxes = [...(task.textBoxes || [])];
      newTextBoxes[textBoxIndex] = {
        ...newTextBoxes[textBoxIndex],
        grammarResults: grammarResults,
      };

      setTask({ ...task, textBoxes: newTextBoxes });
    } catch (error) {
      console.error("Grammar check failed:", error);
      alert("Grammar check failed: " + error.message);
    }
  };

  const processGrammarResults = (data) => {
    const { matches, originalText: checkedText } = data;
    let corrected = checkedText;
    const suggestions = [];

    const sortedMatches = [...matches].sort((a, b) => b.offset - a.offset);

    sortedMatches.forEach((match, index) => {
      if (match.replacements && match.replacements.length > 0) {
        const bestReplacement = match.replacements[0].value;

        suggestions.unshift({
          id: `${match.offset}-${match.length}`,
          original: checkedText.substring(
            match.offset,
            match.offset + match.length
          ),
          corrected: bestReplacement,
          message: match.message,
          category: match.rule?.category || "grammar",
          context: match.context.text,
          offset: match.offset,
          length: match.length,
        });

        corrected =
          corrected.substring(0, match.offset) +
          bestReplacement +
          corrected.substring(match.offset + match.length);
      }
    });

    return {
      correctedText: corrected,
      suggestions: suggestions,
      originalText: checkedText,
      timestamp: new Date().toISOString(),
    };
  };

  const applyGrammarCorrections = (textBoxIndex) => {
    const newTextBoxes = [...(task.textBoxes || [])];
    const textBox = newTextBoxes[textBoxIndex];

    if (textBox.grammarResults?.correctedText) {
      textBox.text = textBox.grammarResults.correctedText;
      textBox.grammarResults = null;
      setTask({ ...task, textBoxes: newTextBoxes });
      alert("Applied all grammar corrections");
    }
  };

  const applySingleSuggestion = (textBoxIndex, suggestion) => {
    const newTextBoxes = [...(task.textBoxes || [])];
    const textBox = newTextBoxes[textBoxIndex];

    if (textBox.text && suggestion) {
      textBox.text = textBox.text.replace(
        suggestion.original,
        suggestion.corrected
      );
      setTask({ ...task, textBoxes: newTextBoxes });
      alert(
        `Applied correction: "${suggestion.original}" → "${suggestion.corrected}"`
      );
    }
  };

  const clearGrammarResults = (textBoxIndex) => {
    const newTextBoxes = [...(task.textBoxes || [])];
    newTextBoxes[textBoxIndex].grammarResults = null;
    setTask({ ...task, textBoxes: newTextBoxes });
  };

  const deleteGrammarFeedback = async (index) => {
    if (
      !window.confirm("Are you sure you want to delete this grammar feedback?")
    )
      return;

    try {
      const newGrammarFeedback = [...(task.grammarFeedback || [])];
      newGrammarFeedback.splice(index, 1);

      const updatedTask = {
        ...task,
        grammarFeedback: newGrammarFeedback,
      };
      setTask(updatedTask);

      await fetch(`http://localhost:5000/api/tasks/${task._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          grammarFeedback: newGrammarFeedback,
        }),
      });
    } catch (error) {
      console.error("Failed to delete grammar feedback:", error);
      alert("Delete failed");
    }
  };

  const applySingleCorrection = (textBoxIndex) => {
    const newTextBoxes = [...(task.textBoxes || [])];
    const textBox = newTextBoxes[textBoxIndex];

    if (textBox.grammarResults?.correctedText) {
      textBox.text = textBox.grammarResults.correctedText;
      setTask({ ...task, textBoxes: newTextBoxes });
      alert("Applied corrected version");
    }
  };

  // ==========================================================
  // OTHER FUNCTIONS
  // ==========================================================
  const addTextBox = () => {
    const newTextBoxes = [
      ...(task.textBoxes || []),
      { text: "", createdAt: new Date(), updatedAt: new Date() },
    ];
    setTask({ ...task, textBoxes: newTextBoxes });
  };

  const deleteTextBox = (index) => {
    if (!window.confirm("Are you sure you want to delete this text box?"))
      return;

    const newTextBoxes = [...(task.textBoxes || [])];
    newTextBoxes.splice(index, 1);
    setTask({ ...task, textBoxes: newTextBoxes });
  };

  const handleAddImage = async (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
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
      setTask(updatedTask);
      setCurrentImage(0);
    } catch (err) {
      console.error(err);
      alert("Image upload failed: " + err.message);
    }
  };

  const deleteImage = async (index) => {
    if (!window.confirm("Confirm delete this image?")) return;

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
      alert("Delete failed: " + err.message);
    }
  };
  // recorder time configuration
  const RECORDING_DURATIONS = {
    Task1: 30, // 30 seconds
    Task2: 180, // 3 minites
    Task3: 240, // 4 minites
    default: 60, // defaut value
  };

  const startRecording = async () => {
    // console information
    console.log("task.taskType structure:", task.taskType);

    if (!navigator.mediaDevices)
      return alert("Browser doesn't support recording");
    if ((task.audioPaths?.length || 0) >= 3)
      return alert("Maximum 3 recordings allowed");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) =>
        audioChunksRef.current.push(e.data);

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
          alert("Recording upload failed: " + err.message);
        }

        setRecording(false);
        setTimeLeft(0);
      };

      mediaRecorder.start();
      setRecording(true);

      let duration;
      if (task.taskType && task.taskType.name) {
        // taskType is a populated object, directly use name
        duration =
          RECORDING_DURATIONS[task.taskType.name] ||
          RECORDING_DURATIONS.default;
        console.log(
          "get the duration from taskType.name :",
          task.taskType.name,
          duration
        );
      } else {
        //backup option
        duration = RECORDING_DURATIONS.default;
        console.log("use the default duration:", duration);
      }

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
      console.error("Cannot access microphone:", err);
      alert("Cannot access microphone");
    }
  };
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
  };

  const deleteAudio = async (index) => {
    if (!window.confirm("Confirm delete this audio?")) return;

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
      else alert(data.message || "Delete failed");
    } catch (err) {
      console.error(err);
    }
  };

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
    formData.append(
      "grammarFeedback",
      JSON.stringify(task.grammarFeedback || [])
    );

    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${task._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const updatedTask = await res.json();
      setTask(updatedTask);
      setLastSaved(new Date());
      alert("Save successful!");
    } catch (err) {
      console.error(err);
      alert("Save failed: " + err.message);
    }
  };

  const addNote = () => {
    const note = prompt("Enter a note:");
    if (!note) return;
    setTask({
      ...task,
      highlightNotes: [...(task.highlightNotes || []), note],
    });
  };

  const deleteNote = (index) => {
    const newNotes = [...(task.highlightNotes || [])];
    newNotes.splice(index, 1);
    setTask({ ...task, highlightNotes: newNotes });
  };

  const taskTree = tasks.reduce((acc, t) => {
    const typeName = t.taskType?.name || "Unknown type";
    const catName = t.category?.name || "Unknown category";
    if (!acc[typeName]) acc[typeName] = {};
    if (!acc[typeName][catName]) acc[typeName][catName] = [];
    acc[typeName][catName].push(t);
    return acc;
  }, {});

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

  const textStats = (task.textBoxes || []).map((textBox, index) => {
    return {
      version: index + 1,
      ...calculateTextStats(textBox.text || ""),
    };
  });

  // ==========================================================
  // STYLES
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
      background: "#07c160",
    },
    center: {
      flex: 4,
      padding: "20px",
      overflowY: "auto",
      textAlign: "center",
      background: "#d5ede1ff",
    },
    right: {
      flex: 1,
      borderLeft: "1px solid #ccc",
      padding: "10px",
      overflowY: "auto",
      background: "#07c160",
    },
    textVersion: {
      fontSize: "14px",
      fontWeight: "bold",
      color: "#2196F3",
      margin: "8px 0",
      padding: "6px",
      background: "white",
      borderRadius: "4px",
      border: "1px solid #2196F3",
    },
    textStatsSmall: {
      fontSize: "12px",
      color: "#666",
      marginTop: "2px",
    },
    lastSaved: {
      fontSize: "12px",
      color: "#787f7aff",
      marginTop: "5px",
      fontWeight: "bold",
    },
    saveButton: {
      background: "#2196F3",
      color: "white",
      border: "none",
      borderRadius: "4px",
      padding: "8px 16px",
      cursor: "pointer",
      margin: "10px 0",
      width: "100%",
      fontSize: "14px",
      fontWeight: "bold",
    },
    displayControls: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
      marginTop: "10px",
    },
    displayButton: {
      background: "#6c757d",
      color: "white",
      border: "none",
      borderRadius: "4px",
      padding: "6px 12px",
      cursor: "pointer",
      fontSize: "12px",
    },
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
    btnPrimary: { background: "#2196F3", color: "white" },
    btnCancel: { background: "#6c757d", color: "white" },
    textarea: {
      width: "90%",
      height: "200px",
      margin: "5px 0",
      padding: "12px",
      borderRadius: "6px",
      //border: "1px solid #ccc",
      fontSize: "16px",
      lineHeight: "1.5",
      fontFamily: "Arial, sans-serif",
      resize: "vertical",
      minHeight: "150px",
      maxHeight: "300px",
      backgroundColor: "transparent", // 去掉背景色
      border: "none", // 去掉边框
      outline: "none", // 去掉焦点边框
    },

    // 同时需要修改编辑状态下的样式
    editingTextarea: {
      //border: "2px solid #2196F3",
      background: "transparent", // 去掉背景色
      //boxShadow: "inset 0 2px 4px rgba(33, 150, 243, 0.1)",
      border: "none", // 去掉边框
      outline: "none", // 去掉焦点边框
    },

    readonlyTextarea: {
      background: "transparent", // 去掉背景色
      //color: "#666",
      //border: "2px solid #e0e0e0",
      cursor: "not-allowed",
      border: "none", // 去掉边框
      outline: "none", // 去掉焦点边框
    },
    audioSection: {
      marginBottom: "25px",
      background: "#f0f8ff",
      borderRadius: "8px",
      padding: "15px",
      border: "1px solid #b3d9ff",
      position: "relative",
    },
    imageSection: {
      marginBottom: "25px",
      background: "#f0fff0",
      borderRadius: "8px",
      padding: "20px",
      border: "1px solid #b3e6b3",
    },

    textSection: {
      marginBottom: "25px",
      background: "#fff8f0",
      borderRadius: "8px",
      padding: "20px",
      border: "1px solid #ffd9b3",
    },
    grammarSection: {
      marginBottom: "25px",
      background: "#f8f9fa",
      borderRadius: "8px",
      padding: "20px",
      border: "1px solid #e9ecef",
    },
    sectionDivider: {
      textAlign: "center",
      marginBottom: "15px",
      position: "relative",
    },
    dividerText: {
      padding: "0 15px",
      fontSize: "18px",
      fontWeight: "bold",
      color: "#333",
    },
    sectionContent: {
      padding: "10px 0",
    },
    textBtn: {
      padding: "6px 12px",
      fontSize: "12px",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      marginLeft: "5px",
    },
    btnView: { background: "#2196F3" },
    btnEdit: { background: "#4CAF50" },
    btnGrammar: { background: "#ff9800", color: "white" },
    textBox: {
      marginBottom: "20px",
      padding: "15px",
      border: "1px solid #e0e0e0",
      borderRadius: "8px",
      background: "white",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
    imageGallery: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "15px",
      marginBottom: "15px",
    },
    navigationContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "20px",
      width: "100%",
    },
    navButton: {
      padding: "10px 15px",
      fontSize: "16px",
      fontWeight: "bold",
      backgroundColor: "#388e3c",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      minWidth: "50px",
    },
    mainImageContainer: {
      border: "2px solid #388e3c",
      borderRadius: "8px",
      padding: "10px",
      backgroundColor: "#e2e2e2ff",
      width: "70%",
      maxWidth: "500px",
      height: "300px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    mainImage: {
      maxWidth: "100%",
      maxHeight: "100%",
      objectFit: "contain",
      borderRadius: "4px",
    },
    thumbnailContainer: {
      display: "flex",
      justifyContent: "center",
      gap: "8px",
      flexWrap: "wrap",
    },
    thumbnail: {
      width: "50px",
      height: "50px",
      objectFit: "cover",
      cursor: "pointer",
      borderRadius: "3px",
      border: "1px solid #388e3c",
    },
    navType: {
      fontWeight: "bold",
      cursor: "pointer",
      padding: "5px 0",
      color: "#fbfbfbff",
    },
    navCat: {
      fontStyle: "italic",
      cursor: "pointer",
      paddingLeft: "15px",
      padding: "3px 0",
      color: "#fbfcfbff",
    },
    navTask: {
      cursor: "pointer",
      paddingLeft: "30px",
      padding: "2px 0",
      fontSize: "12px",
      // 添加基础文本控制
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: "200px", // 与highlight保持一致
    },

    highlight: {
      backgroundColor: "#e0faf0ff",
      fontSize: "12px",
      lineHeight: "1.2",
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: "200px",
      // 移除重复的样式，让navTask的基础样式生效
      whiteSpace: "normal", // 覆盖navTask的nowrap
    },
    audioBox: {
      marginBottom: "15px",
      textAlign: "center",
    },
    grammarHistory: {
      marginTop: "20px",
      padding: "15px",
      background: "white",
      borderRadius: "6px",
      border: "1px solid #ddd",
    },
    feedbackItem: {
      padding: "12px",
      marginBottom: "10px",
      background: "#f8f9fa",
      borderRadius: "4px",
      borderLeft: "3px solid #2196F3",
    },
    feedbackHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "8px",
    },
    copyButton: {
      background: "#6c757d",
      color: "white",
      border: "none",
      borderRadius: "3px",
      padding: "4px 8px",
      cursor: "pointer",
      fontSize: "11px",
    },
    feedbackText: {
      fontSize: "13px",
      lineHeight: "1.4",
      whiteSpace: "pre-wrap",
      fontFamily: "monospace",
    },
    notesSection: {
      marginBottom: "25px",
      background: "#fff3e0",
      borderRadius: "8px",
      padding: "20px",
      border: "1px solid #6c757d",
    },
    notesList: {
      listStyle: "none",
      padding: 0,
      margin: "10px 0",
    },
    noteItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 12px",
      marginBottom: "5px",
      background: "white",
      borderRadius: "4px",
      border: "1px solid #c2c8ceff",
    },
    readingOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    readingWindow: {
      backgroundColor: "white",
      borderRadius: "8px",
      padding: "25px",
      width: "70%",
      maxWidth: "800px",
      maxHeight: "85vh",
      overflow: "auto",
      boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)",
    },
    readingHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
      paddingBottom: "15px",
      borderBottom: "2px solid #f0f0f0",
    },
    readingTitle: {
      fontSize: "20px",
      fontWeight: "bold",
      color: "#333",
    },
    closeButton: {
      background: "#ff4444",
      color: "white",
      border: "none",
      borderRadius: "4px",
      padding: "8px 16px",
      cursor: "pointer",
      fontSize: "14px",
    },
    readingContent: {
      fontSize: "18px",
      lineHeight: "1.8",
      color: "#333",
      whiteSpace: "pre-wrap",
      wordWrap: "break-word",
      minHeight: "200px",
    },
    textarea: {
      width: "90%",
      padding: "10px",

      fontSize: "14px",
      resize: "vertical",
      minHeight: "120px",
      maxHeight: "300px", // 限制最大高度
      overflow: "auto", // 内容超出时显示滚动条
      lineHeight: "1.5",
    },

    textContent: {
      width: "100%",
      height: "100%",
      overflow: "auto", // 确保内容可滚动
      wordWrap: "break-word", // 长单词换行
      whiteSpace: "pre-wrap", // 保留换行符但允许自动换行
    },

    textPreview: {
      backgroundColor: "#f9f9f9",
      color: "#666",
      display: "flex",
      alignItems: "flex-start",
      fontStyle: "italic",
      border: "1px dashed #ccc",
      overflow: "hidden",
    },

    readonlyTextarea: {
      backgroundColor: "#f9f9f9",
      cursor: "default",
    },

    // ===== Integrated Text and Grammar Styles =====
    integratedEditor: {
      borderRadius: "10px",
      // padding: "18px",
      //background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
      marginBottom: "20px",
    },
    editorHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "15px",
      paddingBottom: "12px",
      borderBottom: "2px solid #e3f2fd",
    },
    editorTitle: {
      display: "flex",
      alignItems: "center",
      gap: "15px",
    },
    versionBadge: {
      background: "linear-gradient(135deg, #2196F3 0%, #1976D2 100%)",
      color: "white",
      padding: "6px 12px",
      borderRadius: "20px",
      fontSize: "13px",
      fontWeight: "bold",
      boxShadow: "0 2px 4px rgba(33, 150, 243, 0.3)",
    },
    textStats: {
      fontSize: "13px",
      color: "#666",
      background: "#f5f5f5",
      padding: "4px 8px",
      borderRadius: "4px",
      border: "1px solid #e0e0e0",
    },
    editorActions: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
    },

    grammarResults: {
      marginTop: "20px",
      padding: "18px",
      background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
      borderRadius: "8px",
      border: "2px solid #dee2e6",
      boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)",
    },
    grammarHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "15px",
      paddingBottom: "10px",
      borderBottom: "2px solid #ced4da",
    },
    grammarTitle: {
      margin: 0,
      fontSize: "16px",
      color: "#2c3e50",
      display: "flex",
      alignItems: "center",
      fontWeight: "bold",
    },
    issuesCount: {
      color: "#e74c3c",
      fontWeight: "bold",
      marginLeft: "10px",
      fontSize: "14px",
      background: "#ffeaa7",
      padding: "2px 8px",
      borderRadius: "10px",
    },
    grammarActions: {
      display: "flex",
      gap: "10px",
    },
    correctionPreview: {
      marginBottom: "10px",
      padding: "5px",

      borderRadius: "6px",
    },
    previewLabel: {
      display: "block",
      marginBottom: "8px",
      fontWeight: "bold",
      color: "#27ae60",
      fontSize: "14px",
    },
    correctedTextarea: {
      width: "95%",

      fontSize: "14px",
      resize: "vertical",
      lineHeight: "1.5",
      fontFamily: "Arial, sans-serif",
      minHeight: "95%",
      backgroundColor: "transparent",
      border: "none",
      outline: "none",
    },
    suggestionsList: {
      borderTop: "2px solid #bdc3c7",
      paddingTop: "15px",
    },
    suggestionsTitle: {
      margin: "0 0 12px 0",
      fontSize: "15px",
      color: "#2c3e50",
      fontWeight: "bold",
    },
    suggestionItem: {
      padding: "14px",
      marginBottom: "12px",

      borderRadius: "8px",
      border: "2px solid #e9ecef",
    },
    suggestionHeader: {
      display: "flex",
      alignItems: "flex-start",
      marginBottom: "10px",
    },
    suggestionNumber: {
      background: "linear-gradient(135deg, #6c757d 0%, #495057 100%)",
      color: "white",
      borderRadius: "12px",
      padding: "4px 10px",
      fontSize: "12px",
      fontWeight: "bold",
      marginRight: "12px",
      minWidth: "28px",
      textAlign: "center",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    },
    suggestionMessage: {
      color: "#2c3e50",
      fontWeight: "600",
      fontSize: "14px",
      lineHeight: "1.4",
      flex: 1,
    },
    correctionExample: {
      display: "flex",
      alignItems: "center",
      marginBottom: "8px",
      fontSize: "14px",
      padding: "8px",
    },
    incorrectText: {
      color: "#e74c3c",
      textDecoration: "line-through",
      fontWeight: "bold",
      background: "#ffeaa7",
      padding: "4px 8px",
      borderRadius: "4px",
      border: "1px solid #fab1a0",
    },
    arrow: {
      color: "#7f8c8d",
      margin: "0 12px",
      fontSize: "16px",
      fontWeight: "bold",
    },
    correctText: {
      color: "#27ae60",
      fontWeight: "bold",
      background: "#d1f2eb",
      padding: "4px 8px",
      borderRadius: "4px",
      border: "1px solid #82e0aa",
    },
    context: {
      fontSize: "12px",
      color: "#384849ff",
      fontStyle: "italic",
      marginTop: "6px",
      padding: "6px 8px",
      // background: "#ecf0f1",
      borderRadius: "4px",
      // borderLeft: "3px solid #bdc3c7",
    },
    grammarHistorySection: {
      marginBottom: "25px",
      background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
      borderRadius: "10px",
      padding: "20px",
      border: "2px solid #dee2e6",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    },
    feedbackTitle: {
      fontWeight: "bold",
      color: "#2c3e50",
      fontSize: "14px",
    },
    feedbackMeta: {
      fontSize: "11px",

      marginTop: "6px",
      fontStyle: "italic",
    },
    feedbackActions: {
      display: "flex",
      gap: "8px",
    },

    // ===== New Styles for Level Selector and Panels =====
    levelSelector: {
      marginBottom: "15px",
      padding: "12px",
    },
    levelLabel: {
      display: "block",
      marginBottom: "8px",
      fontWeight: "bold",
      color: "#333",
      fontSize: "14px",
    },
    levelSelect: {
      width: "100%",
      padding: "8px 12px",
      border: "1px solid #b1d6f5ff",
      borderRadius: "6px",
      fontSize: "14px",
      marginBottom: "8px",
    },
    levelDescription: {
      fontSize: "12px",
      color: "#666",
      fontStyle: "italic",
      padding: "4px 8px",
      borderRadius: "4px",
    },
    controlButtonsRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "15px",
      paddingTop: "15px",
      borderTop: "1px solid #ddd",
    },
    featureButtons: {
      display: "flex",
      gap: "10px",
    },
    featureButton: {
      background: "#6c757d",
      color: "white",
      border: "none",
      borderRadius: "6px",
      padding: "8px 12px",
      cursor: "pointer",
      fontSize: "12px",
      transition: "all 0.2s",
    },
    historyPanel: {
      marginBottom: "20px",
      background: "white",
      borderRadius: "10px",
      border: "2px solid #dee2e6",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      overflow: "hidden",
    },
    panelHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "15px 20px",
      background: "linear-gradient(135deg, #059134ff 0%, #76d26bff 100%)",
      color: "white",
    },
    closePanelButton: {
      background: "rgba(255,255,255,0.2)",
      color: "white",
      border: "none",
      borderRadius: "4px",
      padding: "6px 12px",
      cursor: "pointer",
      fontSize: "14px",
    },
    panelContent: {
      padding: "20px",
      maxHeight: "400px",
      overflowY: "auto",
    },
    notesInputSection: {
      marginBottom: "20px",
      padding: "15px",
      background: "#f8f9fa",
      borderRadius: "6px",
    },
    noteTextarea: {
      width: "90%",
      padding: "12px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      fontSize: "14px",
      resize: "vertical",
      minHeight: "80px",
      marginBottom: "10px",
    },
    addNoteButton: {
      background: "#28a745",
      color: "white",
      border: "none",
      borderRadius: "4px",
      padding: "8px 16px",
      cursor: "pointer",
      fontSize: "12px",
    },
    notesList: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    noteText: {
      flex: 1,
      fontSize: "14px",
      lineHeight: "1.4",
    },
    deleteNoteButton: {
      background: "#dc3545",
      color: "white",
      border: "none",
      borderRadius: "4px",
      padding: "4px 8px",
      cursor: "pointer",
      fontSize: "12px",
    },
    noDataMessage: {
      textAlign: "center",
      color: "#6c757d",
      fontStyle: "italic",
      padding: "20px",
    },
  };

  // ==========================================================
  // MAIN RENDER
  // ==========================================================
  return (
    <div style={styles.container}>
      {/* Reading Window Overlay */}
      {readingWindow.isOpen && (
        <div style={styles.readingOverlay} onClick={closeReadingWindow}>
          <div
            style={styles.readingWindow}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.readingHeader}>
              <div style={styles.readingTitle}>{readingWindow.title}</div>
              <button style={styles.closeButton} onClick={closeReadingWindow}>
                ✕ Close
              </button>
            </div>
            <div style={styles.readingContent}>{readingWindow.content}</div>
          </div>
        </div>
      )}

      {/* Left navigation */}
      <div style={styles.left}>
        <h3 style={{ color: "white" }}>Task Navigation</h3>
        {renderTree()}
      </div>

      {/* Center content */}
      <div style={styles.center}>
        <h2>{task.title}</h2>

        {/* UPDATED AUDIO SECTION WITH LEVEL SELECTOR */}
        <div style={styles.audioSection}>
          <div style={styles.sectionDivider}>
            <span style={styles.dividerText}>
              Audio Recording ({task.audioPaths?.length || 0}/3)
            </span>
          </div>

          {/* Learning Level Selector */}
          <div style={styles.levelSelector}>
            <label style={styles.levelLabel}>Learning Level:</label>
            <select
              value={task.masteryLevel || 0}
              onChange={(e) => handleLevelChange(parseInt(e.target.value))}
              style={styles.levelSelect}
            >
              <option value={0}>Level 0 - Beginner</option>
              <option value={1}>Level 1 - Basic</option>
              <option value={2}>Level 2 - Intermediate</option>
              <option value={3}>Level 3 - Proficient</option>
              <option value={4}>Level 4 - Advanced</option>
            </select>
            <div style={styles.levelDescription}>
              {getLevelDescription(task.masteryLevel || 0)}
            </div>
          </div>

          <div style={styles.sectionContent}>
            {task.audioPaths?.map((audio, i) => (
              <div key={i} style={styles.audioBox}>
                <audio controls src={`http://localhost:5000${audio}`} />
                <br />
                <LimitedAddButton
                  currentCount={0}
                  maxCount={999}
                  onClick={() => deleteAudio(i)}
                  label="🗑️ Delete Recording"
                  btnStyle={{ ...styles.btn, ...styles.btnDelete }}
                />
              </div>
            ))}
            {recording ? (
              <LimitedAddButton
                currentCount={0}
                maxCount={999}
                onClick={stopRecording}
                label={`⏹️ Stop Recording (${timeLeft}s)`}
                btnStyle={{
                  ...styles.btn,
                  ...styles.btnDelete,
                  marginRight: 10,
                }}
              />
            ) : (
              <LimitedAddButton
                currentCount={task.audioPaths?.length || 0}
                maxCount={3}
                onClick={startRecording}
                label="🎤 Start Recording"
                btnStyle={{ ...styles.btn, ...styles.btnPrimary }}
              />
            )}
          </div>

          {/* Display Control and Feature Buttons */}
          <div style={styles.controlButtonsRow}>
            <div style={styles.displayControls}>
              <button style={styles.displayButton} onClick={toggleImages}>
                {showImages ? "🙈 Hide Images" : "🖼️ Show Images"}
              </button>
              <button style={styles.displayButton} onClick={toggleText}>
                {showText ? "🙈 Hide Text" : "📝 Show Text"}
              </button>
            </div>

            <div style={styles.featureButtons}>
              <button
                style={styles.featureButton}
                onClick={() => setShowNotes(!showNotes)}
              >
                {showNotes ? "📝 Hide Notes" : "📝 Show Notes"}
              </button>
            </div>
          </div>
        </div>

        {/* Grammar Feedback History Panel */}
        {showGrammarHistory && (
          <div style={styles.historyPanel}>
            <div style={styles.panelHeader}>
              <h4>Grammar Feedback History</h4>
              <button
                style={styles.closePanelButton}
                onClick={() => setShowGrammarHistory(false)}
              >
                ✕
              </button>
            </div>
            <div style={styles.panelContent}>
              {task.grammarFeedback && task.grammarFeedback.length > 0 ? (
                task.grammarFeedback.map((feedback, index) => (
                  <div key={index} style={styles.feedbackItem}>
                    <div style={styles.feedbackHeader}>
                      <span style={styles.feedbackTitle}>
                        Check #{index + 1}
                      </span>
                      <div style={styles.feedbackActions}>
                        <button
                          style={styles.copyButton}
                          onClick={() =>
                            navigator.clipboard.writeText(feedback)
                          }
                        >
                          📋 Copy
                        </button>
                        <button
                          style={{
                            ...styles.copyButton,
                            background: "#dc3545",
                          }}
                          onClick={() => deleteGrammarFeedback(index)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                    <div style={styles.feedbackText}>{feedback}</div>
                  </div>
                ))
              ) : (
                <div style={styles.noDataMessage}>
                  No grammar feedback history yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes Panel */}
        {showNotes && (
          <div style={styles.historyPanel}>
            <div style={styles.panelHeader}>
              <h4>Notes</h4>
              <button
                style={styles.closePanelButton}
                onClick={() => setShowNotes(false)}
              >
                ✕
              </button>
            </div>
            <div style={styles.panelContent}>
              <div style={styles.notesInputSection}>
                <textarea
                  style={styles.noteTextarea}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a new note..."
                  rows={3}
                />
                <button style={styles.addNoteButton} onClick={addNewNote}>
                  ➕ Add Note
                </button>
              </div>

              <div style={styles.notesList}>
                {(task.highlightNotes || []).map((note, idx) => (
                  <div key={idx} style={styles.noteItem}>
                    <span style={styles.noteText}>{note}</span>
                    <button
                      style={styles.deleteNoteButton}
                      onClick={() => deleteNote(idx)}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* IMAGE SECTION */}
        {showImages && (
          <div style={styles.imageSection}>
            <div style={styles.sectionDivider}>
              <span style={styles.dividerText}>Image</span>
            </div>
            <div style={styles.sectionContent}>
              {(task.imagePaths || []).length > 0 && (
                <div style={styles.imageGallery}>
                  <div style={styles.navigationContainer}>
                    <button
                      style={styles.navButton}
                      onClick={() =>
                        setCurrentImage((prev) =>
                          prev > 0
                            ? prev - 1
                            : (task.imagePaths || []).length - 1
                        )
                      }
                      disabled={(task.imagePaths || []).length <= 1}
                    >
                      ◀
                    </button>

                    <div style={styles.mainImageContainer}>
                      <img
                        src={`http://localhost:5000${task.imagePaths[currentImage]}`}
                        alt=""
                        style={styles.mainImage}
                      />
                    </div>

                    <button
                      style={styles.navButton}
                      onClick={() =>
                        setCurrentImage((prev) =>
                          prev < (task.imagePaths || []).length - 1
                            ? prev + 1
                            : 0
                        )
                      }
                      disabled={(task.imagePaths || []).length <= 1}
                    >
                      ▶
                    </button>
                  </div>

                  <div style={styles.thumbnailContainer}>
                    {(task.imagePaths || []).map((img, i) => (
                      <img
                        key={i}
                        src={`http://localhost:5000${img}`}
                        alt=""
                        style={{
                          ...styles.thumbnail,
                          border:
                            i === currentImage
                              ? "2px solid #2196F3"
                              : "1px solid #ddd",
                        }}
                        onClick={() => setCurrentImage(i)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {(task.imagePaths || []).length > 0 && (
                <button
                  style={{
                    ...styles.btn,
                    ...styles.btnDelete,
                    margin: "10px 5px",
                  }}
                  onClick={() => deleteImage(currentImage)}
                >
                  🗑️ Delete Current Image
                </button>
              )}

              {(task.imagePaths?.length || 0) < 3 && (
                <>
                  <button
                    style={{
                      ...styles.btn,
                      ...styles.btnAdd,
                      margin: "10px 5px",
                    }}
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
          </div>
        )}

        {/* TEXT & GRAMMAR INTEGRATED SECTION */}
        {showText && (
          <div style={styles.textSection}>
            <div style={styles.sectionDivider}>
              <span style={styles.dividerText}>
                Text Editing & Grammar Check
              </span>
            </div>
            <div style={styles.sectionContent}>
              {(task.textBoxes || []).map((tb, i) => (
                <div key={i} style={styles.textBox}>
                  <div style={styles.integratedEditor}>
                    <div style={styles.editorHeader}>
                      <div style={styles.editorTitle}>
                        <span style={styles.versionBadge}>Version {i + 1}</span>
                        <span style={styles.textStats}>
                          {calculateTextStats(tb.text || "").words} words |{" "}
                          {calculateTextStats(tb.text || "").sentences}{" "}
                          sentences
                        </span>
                      </div>
                      <div style={styles.editorActions}>
                        <button
                          style={{ ...styles.textBtn, ...styles.btnView }}
                          onClick={() => openReadingWindow(tb.text, i + 1)}
                        >
                          👁️ Full Screen
                        </button>

                        {/* Edit/Save button*/}
                        <button
                          style={{
                            ...styles.textBtn,
                            ...(editingStates[i]
                              ? styles.btnSave
                              : styles.btnEdit),
                          }}
                          onClick={() =>
                            editingStates[i]
                              ? saveAndExitEdit(i)
                              : toggleTextEditMode(i)
                          }
                        >
                          {editingStates[i] ? "💾 Save" : "✏️ Edit"}
                        </button>

                        {/* Check Grammar button */}
                        <button
                          style={{
                            ...styles.textBtn,
                            ...styles.btnGrammar,
                            ...((!editingStates[i] || !tb.text?.trim()) &&
                              styles.btnDisabled),
                          }}
                          onClick={() =>
                            handleIntegratedGrammarCheck(i, tb.text)
                          }
                          disabled={!editingStates[i] || !tb.text?.trim()}
                          title={
                            !editingStates[i]
                              ? "Please click Edit to enter editing mode"
                              : !tb.text?.trim()
                              ? "Please enter text first"
                              : "Check grammar"
                          }
                        >
                          🔍 Check Grammar
                        </button>

                        {/* Delete button */}
                        <button
                          style={{ ...styles.textBtn, ...styles.btnDelete }}
                          onClick={() => deleteTextBox(i)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>

                    {/* text area - user friendly */}
                    {/* only edit this area by click the edit button*/}
                    {editingStates[i] ? (
                      <textarea
                        style={{
                          ...styles.textarea,
                          ...styles.editingTextarea,
                        }}
                        value={tb.text || ""}
                        onChange={(e) => handleTextBoxChange(i, e.target.value)}
                        placeholder="Enter French text... (supports grammar check)"
                        rows={6}
                      />
                    ) : (
                      <div
                        style={{
                          ...styles.textarea,
                          ...styles.readonlyTextarea,
                          ...styles.textPreview,
                        }}
                      >
                        <div style={styles.textContent}>
                          {tb.text ||
                            "Please click Edit button to start editing"}
                        </div>
                      </div>
                    )}

                    {tb.grammarResults && editingStates[i] && (
                      <div style={styles.grammarResults}>
                        <div style={styles.grammarHeader}>
                          <h5 style={styles.grammarTitle}>
                            Grammar Check Results
                            <span style={styles.issuesCount}>
                              ({tb.grammarResults.suggestions?.length || 0}{" "}
                              issues)
                            </span>
                          </h5>
                          <div style={styles.grammarActions}>
                            <button
                              style={{
                                ...styles.textBtn,
                                ...styles.btnPrimary,
                              }}
                              onClick={() => applyGrammarCorrections(i)}
                            >
                              ✅ Apply All Corrections
                            </button>
                            <button
                              style={{ ...styles.textBtn, ...styles.btnCancel }}
                              onClick={() => clearGrammarResults(i)}
                            >
                              ❌ Clear Results
                            </button>
                          </div>
                        </div>

                        {tb.grammarResults.correctedText && (
                          <div style={styles.correctionPreview}>
                            <label style={styles.previewLabel}>
                              Correction Suggestion:
                            </label>
                            <textarea
                              style={styles.correctedTextarea}
                              value={tb.grammarResults.correctedText}
                              readOnly
                              rows={4}
                              placeholder="Corrected text will appear here..."
                            />
                            <button
                              style={{
                                ...styles.textBtn,
                                ...styles.btnSave,
                                marginTop: "8px",
                              }}
                              onClick={() => applySingleCorrection(i)}
                            >
                              📝 Apply This Correction
                            </button>
                          </div>
                        )}

                        {tb.grammarResults.suggestions?.length > 0 && (
                          <div style={styles.suggestionsList}>
                            <h6 style={styles.suggestionsTitle}>
                              Detailed Suggestions:
                            </h6>
                            {tb.grammarResults.suggestions.map(
                              (suggestion, suggestionIndex) => (
                                <div
                                  key={suggestionIndex}
                                  style={styles.suggestionItem}
                                >
                                  <div style={styles.suggestionHeader}>
                                    <span style={styles.suggestionNumber}>
                                      #{suggestionIndex + 1}
                                    </span>
                                    <span style={styles.suggestionMessage}>
                                      {suggestion.message}
                                    </span>
                                  </div>
                                  <div style={styles.correctionExample}>
                                    <span style={styles.incorrectText}>
                                      "{suggestion.original}"
                                    </span>
                                    <span style={styles.arrow}>→</span>
                                    <span style={styles.correctText}>
                                      "{suggestion.corrected}"
                                    </span>
                                  </div>
                                  {suggestion.context && (
                                    <div style={styles.context}>
                                      Context: {suggestion.context}
                                    </div>
                                  )}
                                  <button
                                    style={{
                                      ...styles.textBtn,
                                      ...styles.btnPrimary,
                                      marginTop: "4px",
                                      fontSize: "11px",
                                    }}
                                    onClick={() =>
                                      applySingleSuggestion(i, suggestion)
                                    }
                                  >
                                    Apply This Correction
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <LimitedAddButton
                currentCount={task.textBoxes?.length || 0}
                maxCount={3}
                onClick={addTextBox}
                label="➕ Add Text Box"
                btnStyle={{ ...styles.btn, ...styles.btnAdd }}
              />
            </div>
          </div>
        )}

        {/* SAVE BUTTON */}
        <div style={styles.section}>
          <LimitedAddButton
            currentCount={0}
            maxCount={999}
            onClick={saveTask}
            label="💾 Save Task"
            btnStyle={{ ...styles.btn, ...styles.btnSave }}
          />
        </div>
      </div>

      {/* RIGHT INFORMATION PANEL */}
      <div style={styles.right}>
        <h3>Task Information</h3>

        {/* 新增：任务基本信息 */}
        <div style={styles.taskBasicInfo}>
          <p style={styles.truncateText}>
            <strong>Type:</strong>{" "}
            {task.taskType?.name ||
              task.taskType?._id ||
              task.taskType ||
              "N/A"}
          </p>
          <p style={styles.truncateText}>
            <strong>Category:</strong>{" "}
            {task.category?.name ||
              task.category?._id ||
              task.category ||
              "N/A"}
          </p>
        </div>

        <p>
          <strong>Master Level:</strong> {task.masteryLevel || 0}
        </p>
        <p>
          <strong>Current Level:</strong>{" "}
          {getLevelDescription(task.masteryLevel || 0)}
        </p>

        {textStats.map((stats, index) => (
          <div key={index} style={styles.textVersion}>
            Text Version {stats.version}
            <div style={styles.textStatsSmall}>
              words: {stats.words} | sentences: {stats.sentences}
            </div>
          </div>
        ))}

        <button style={styles.saveButton} onClick={manualSaveTask}>
          💾 Save Task
        </button>

        {lastSaved && (
          <div style={styles.lastSaved}>
            Last saved: {lastSaved.toLocaleTimeString()}
          </div>
        )}

        {note && (
          <div style={{ marginTop: "15px" }}>
            <strong>Task Notes:</strong>
            <p style={{ fontSize: "14px", marginTop: "5px" }}>{note}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetails;
