import React, { useRef, useState, useEffect } from "react";
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate, useLocation } from "react-router-dom";
import { Box, VStack, HStack, Tabs, TabPanels, TabPanel, Text } from "@chakra-ui/react";
import { Editor } from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { CODE_SNIPPETS } from "../constants";
import Output from "./Output";
import RealTimeMonitoring from "./RealTimeMonitoring";
import axios from "axios";

const CodeEditor = () => {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0(); // Auth0 hooks
  const editorRef = useRef();
  const [value, setValue] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [problemStatement, setProblemStatement] = useState("Read the problem statement here...");
  const [problemName, setProblemName] = useState("");
  const [tabSwitchMessage, setTabSwitchMessage] = useState(""); // For displaying message on tab switching
  const navigate = useNavigate();
  const location = useLocation();
  const { problem } = location.state || { problem: null };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect();
      return;
    }

    if (problem) {
      setProblemStatement(problem.statement);
      setProblemName(problem.name);
    }

    const wasReloaded = localStorage.getItem("wasReloaded");
    if (wasReloaded) {
      alert("Page reload detected, you will be redirected to homepage on tab switch.");
      localStorage.removeItem("wasReloaded");
    }

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      localStorage.setItem("wasReloaded", "true");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    if (problem) {
      setProblemStatement(problem.statement);
      setProblemName(problem.name);
    }

    const enterFullScreen = () => {
      const element = document.documentElement;
      if (!document.fullscreenElement) {
        element.requestFullscreen().catch((err) => {
          console.error("Error attempting to enable full-screen mode:", err.message);
        });
      }
    };

    enterFullScreen();

    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) {
        alert("You exited full-screen mode. Returning to the homepage.");
        navigate("/");
      }
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchMessage("Tab switching is not allowed while working in the code editor.");
        alert("Tab switching is not allowed, returning to homepage.");
        navigate("/");
      } else {
        setTabSwitchMessage("");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [problem, navigate, isAuthenticated, isLoading, loginWithRedirect]);


  const saveCode = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/save-code", {
        language,
        code: value,
        problemName,
      });

      alert(response.data.message);
      localStorage.setItem(`attempted-${problemName}`, true);
      navigate("/");
    } catch (error) {
      console.error("Error saving code:", error);
      alert("Failed to save code.");
    }
  };

  const onMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const onSelect = (language) => {
    setLanguage(language);
    setValue(CODE_SNIPPETS[language]);
  };

  if (isLoading) {
    return <div>Loading...</div>; 
  }

  return (
    <Box height="100%" bg="gray.100">
      {/* Position RealTimeMonitoring in a corner */}
      <Box position="absolute" top="0px" right="0px" zIndex={2} bg="transparent" p={2} borderRadius="md" boxShadow="md" height="0px">
        <RealTimeMonitoring />
      </Box>

      <HStack spacing={4} height="100%" bg={"black"}>
        {/* Left Section: Problem Statement */}
        <Box w="50%" p={4} bg="black" borderRadius="md" boxShadow="md">
          <Box textColor="white" fontSize="24px" mb={4} fontWeight="bold">
            {problemName || "Problem Name"}
          </Box>
          <Box
            height="100%"
            textColor="white"
            fontSize="17px"
            fontFamily="monospace"
            minHeight="732px"
            overflow="auto"
            bg="gray.800"
            borderRadius="md"
            p={4}
            whiteSpace="pre-wrap"
            style={{
              userSelect: "none",
              lineHeight: "1.6",
            }}
          >
            {problemStatement}
          </Box>
          <button
            onClick={saveCode}
            style={{
              padding: "10px",
              margin: "10px",
              background: "blue",
              color: "white",
            }}
          >
            Save Code
          </button>
        </Box>

        {/* Right Section: Code Editor and Output */}
        <VStack w="50%" spacing={5} height="100%">
          {/* Code Editor */}
          <Box w="100%" bg="black" borderRadius="md" boxShadow="md" flexGrow={1} px="5px">
            <LanguageSelector language={language} onSelect={onSelect} />
            <Editor
              options={{
                minimap: { enabled: false },
              }}
              height="50vh"
              theme="vs-dark"
              language={language}
              defaultValue={CODE_SNIPPETS[language]}
              onMount={onMount}
              value={value}
              onChange={(value) => setValue(value)}
            />
          </Box>

          {/* Tabs for Test Cases and Output */}
          <Tabs w="100%" height="100%" variant="enclosed" bg="black" borderRadius="md" boxShadow="md">
            <TabPanels>
              <TabPanel>
                <Box>
                  <Output editorRef={editorRef} language={language} />
                </Box>
              </TabPanel>
              <TabPanel>
                <Box>
                  <Output editorRef={editorRef} language={language} />
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>

          {/* Tab Switch Message */}
          {tabSwitchMessage && (
            <Text color="red" fontSize="18px" fontWeight="bold">
              {tabSwitchMessage}
            </Text>
          )}
        </VStack>
      </HStack>
    </Box>
  );
};

export default CodeEditor;
