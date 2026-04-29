import { Suspense, lazy, useState } from 'react';
import { Navbar } from '@/components/Navbar/Navbar';
import { Hero } from '@/components/Hero/Hero';
import { About } from '@/components/About/About';
import { Experience } from '@/components/Experience/Experience';
import { Projects } from '@/components/Projects/Projects';
import { Education } from '@/components/Education/Education';
import { Contact } from '@/components/Contact/Contact';
import { Clients } from '@/components/Clients/Clients';
import { ChatButton, ChatContext } from '@/components/Chatbot/ChatButton';
import { Cursor } from '@/components/Cursor/Cursor';

const ChatWindow = lazy(() =>
  import('@/components/Chatbot/ChatWindow').then((m) => ({ default: m.ChatWindow }))
);

function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ChatContext.Provider value={{ isOpen, setIsOpen }}>
      <Cursor />
      <Navbar />
      <main>
        <Hero />
        <Clients />
        <About />
        <Experience />
        <Projects />
        <Education />
        <Contact />
      </main>
      <Suspense fallback={null}>
        <ChatWindow />
      </Suspense>
      <ChatButton />
    </ChatContext.Provider>
  );
}

export default App;
