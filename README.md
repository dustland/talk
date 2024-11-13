<div align="center">

<img src="public/talk.png" alt="IELTS Speaking Master" width="128" />

# Talk Master

An AI-powered IELTS Speaking practice platform that provides real-time feedback, evaluation, and scoring.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-blueviolet.svg)](https://nextjs.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-green.svg)](https://openai.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

[Online](https://talk.dustland.ai) · [Report Bug](https://github.com/dustland/talk/issues) · [Request Feature](https://github.com/dustland/talk/issues)

</div>

## ✨ Features

- 🎯 Real-time IELTS speaking practice for all three parts
- 🎙️ Voice recording with automatic transcription
- 🤖 AI-powered evaluation and scoring
- 💡 Detailed feedback on pronunciation, grammar, and vocabulary
- 🔊 Text-to-Speech for reference answers
- 📊 Band score calculation following official IELTS criteria
- 🎨 Modern and responsive UI with dark mode support

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- OpenAI API key

### Installation

1. Clone the repository

```bash
git clone https://github.com/dustland/talk.git
```

2. Install dependencies

```bash
pnpm install
```

3. Set up environment variables

```bash
cp .env.example .env.local
```

Add your OpenAI API key to `.env.local`:

```env
OPENAI_API_KEY=your_api_key_here
```

4. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🛠️ Tech Stack

- [Next.js 15](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Programming language
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Shadcn/ui](https://ui.shadcn.com/) - UI components
- [OpenAI API](https://openai.com/api/) - AI models (GPT-4o, Whisper, TTS)
- [Framer Motion](https://www.framer.com/motion/) - Animations

## 📖 Usage

1. **Select Speaking Part**: Choose between Part 1 (Introduction), Part 2 (Long Turn), or Part 3 (Discussion)
2. **Start Recording**: Click the "Start Speaking" button to begin recording your answer
3. **Stop Recording**: Click "Stop Recording" when finished
4. **Review Feedback**:
   - View your transcribed answer
   - See detailed AI feedback
   - Check your band scores
   - Listen to a reference answer

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) for providing the AI models
- [Vercel](https://vercel.com/) for hosting
- [Shadcn](https://twitter.com/shadcn) for the amazing UI components
- IELTS speaking test format and criteria

## 📧 Contact

Dustland - [@dustland_ai](https://x.com/dustland_ai) - hi@dustland.ai

Project Link: [https://github.com/dustland/talk](https://github.com/dustland/talk)

---

<div align="center">
Made with ❤️ for IELTS learners and AI enthusiasts
</div>
