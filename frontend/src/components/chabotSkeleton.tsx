import { useEffect, useRef } from "react"
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  Avatar,
} from "@mui/material"
import SendIcon from "@mui/icons-material/Send"

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  text: string
}

type ChatbotSkeletonProps = {
  title: string
  subtitle?: string
  messages: ChatMessage[]
  inputValue: string
  onInputChange: (value: string) => void
  onSend: () => void
  isSending?: boolean
  placeholder?: string
}

export function ChatbotSkeleton({
  title,
  subtitle,
  messages,
  inputValue,
  onInputChange,
  onSend,
  isSending = false,
  placeholder = "Digite sua mensagem...",
}: ChatbotSkeletonProps) {
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (inputRef.current && inputValue === "") {
      inputRef.current.style.height = "auto"
    }
  }, [inputValue])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
      if (inputRef.current) {
        inputRef.current.style.height = "auto"
      }
    }
  }

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: "calc(100vh - 180px)",
        position: "relative",
        gap: 2,
      }}
    >
      <Stack spacing={0.5}>
        <Typography variant="h5" fontWeight={700}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </Stack>

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          backgroundColor: "background.paper",
        }}
      >
        {messages.map((msg) => (
          <Stack
            key={msg.id}
            direction="row"
            spacing={1}
            alignItems="flex-start"
            sx={{ justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}
          >
            {msg.role === "assistant" ? <Avatar sx={{ width: 28, height: 28 }}>B</Avatar> : null}
            <Box
              sx={{
                bgcolor: msg.role === "user" ? "primary.main" : "grey.100",
                color: msg.role === "user" ? "primary.contrastText" : "text.primary",
                px: 1.5,
                py: 1,
                borderRadius: 2,
                maxWidth: { xs: "85%", md: "70%" },
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              <Typography variant="body2">{msg.text}</Typography>
            </Box>
            {msg.role === "user" ? <Avatar sx={{ width: 28, height: 28, bgcolor: "primary.main" }}>Você</Avatar> : null}
          </Stack>
        ))}
        {isSending ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              Gerando resposta...
            </Typography>
          </Stack>
        ) : null}
      </Box>

      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault()
          onSend()
        }}
        sx={{
          mt: "auto",
          position: "sticky",
          bottom: 0,
          backgroundColor: "background.paper",
          pt: 1,
        }}
      >
        <TextField
          inputRef={inputRef}
          multiline
          minRows={2}
          maxRows={6}
          fullWidth
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          InputProps={{
            endAdornment: (
              <IconButton color="primary" onClick={onSend} disabled={isSending || !inputValue.trim()}>
                {isSending ? <CircularProgress size={18} /> : <SendIcon />}
              </IconButton>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              alignItems: "flex-start",
            },
          }}
        />
      </Box>
    </Paper>
  )
}
