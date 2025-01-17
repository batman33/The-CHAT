import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid/index.js";
import { useCallback, useEffect, useRef, useState } from "react";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout.jsx";
import ChatLayout from "@/Layouts/ChatLayout.jsx";

import AttachmentPreviewModal from "@/Components/App/AttachmentPreviewModal.jsx";
import { ConversationHeader } from "@/Components/App/ConversationHeader.jsx";
import { MessageInput } from "@/Components/App/MessageInput.jsx";
import { MessageItem } from "@/Components/App/MessageItem.jsx";

import { useEventBus } from "@/EventBus.jsx";

function Home({ selectedConversation = null, messages = null }) {
  const [ localMessages, setLocalMessages ] = useState([]);
  const [ noMoreMessages, setNoMoreMessages ] = useState(false);
  const [ scrollFromBottom, setScrollFromBottom ] = useState(undefined);
  const [ showAttachmentPreview, setShowAttachmentPreview ] = useState(false);
  const [ previewAttachment, setPreviewAttachment ] = useState({});

  const messagesCtrRef = useRef(null);
  const loadMoreIntersect = useRef(null);

  const { on } = useEventBus();

  useEffect(() => {
    setTimeout(() => {
      if (selectedConversation && messagesCtrRef.current) {
        messagesCtrRef.current.scrollTop = messagesCtrRef.current.scrollHeight;
      }
    }, 10);

    const offCreated = on('message.created', messageCreated);
    const offDeleted = on('message.deleted', messageDeleted);

    return () => {
      offCreated();
      offDeleted();
    }
  }, [ selectedConversation ]);

  useEffect(() => {
    setLocalMessages(messages ? messages.data.reverse() : []);
  }, [ messages ]);

  useEffect(() => {
    if (messagesCtrRef.current && scrollFromBottom !== null) {
      messagesCtrRef.current.scrollTop = messagesCtrRef.current.scrollHeight - messagesCtrRef.current.offsetHeight - scrollFromBottom;
    }

    if (noMoreMessages) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && loadMoreMessages()),
      {
        rootMargin: "0px 0px 250px 0px",
      },
    );

    if (loadMoreIntersect.current) {
      setTimeout(() => {
        observer.observe(loadMoreIntersect.current)
      }, 100);
    }

    setScrollFromBottom(0);
    setNoMoreMessages(false);

    return () => {
      observer.disconnect();
    }
  }, [ localMessages ]);

  const messageCreated = (message) => {
    if (
      selectedConversation &&
      selectedConversation.is_group &&
      selectedConversation.id === parseInt(message.group_id)
    ) {
      setLocalMessages((prevMessages) => ([ ...prevMessages, message ]));
    }

    if (
      selectedConversation &&
      selectedConversation.is_user &&
      (
        selectedConversation.id === parseInt(message.sender_id) ||
        selectedConversation.id === parseInt(message.receiver_id)
      )
    ) {
      setLocalMessages((prevMessages) => ([ ...prevMessages, message ]));
    }
  }

  const messageDeleted = ({ message }) => {
    if (
      selectedConversation &&
      selectedConversation.is_group &&
      selectedConversation.id === parseInt(message.group_id)
    ) {
      setLocalMessages((prevMessages) => {
        return prevMessages.filter(m => m.id !== message.id)
      });
    }

    if (
      selectedConversation &&
      selectedConversation.is_user &&
      (
        selectedConversation.id === parseInt(message.sender_id) ||
        selectedConversation.id === parseInt(message.receiver_id)
      )
    ) {
      setLocalMessages((prevMessages) => {
        return prevMessages.filter(m => m.id !== message.id)
      });
    }
  }

  const loadMoreMessages = useCallback(() => {
    if (noMoreMessages) {
      return;
    }

    // Find the first message object
    const firstMessage = localMessages[0];
    axios.get(route("message.loadOlder", firstMessage.id)).then(({ data }) => {
      if (data.data.length === 0) {
        setNoMoreMessages(true);
        return;
      }

      // Calculate how much is scrolled from bottom and scroll to the same position from bottom after message are loaded
      const scrollHeight = messagesCtrRef.current.scrollHeight;
      const scrollTop = messagesCtrRef.current.scrollTop;
      const clientHeight = messagesCtrRef.current.clientHeight;

      const tmpScrollFromBottom = scrollHeight - scrollTop - clientHeight;

      setScrollFromBottom(tmpScrollFromBottom);

      setLocalMessages((prevMessages) => {
        return [ ...data.data.reverse(), ...prevMessages ];
      });
    });
  }, [ localMessages, noMoreMessages ]);

  const onAttachmentClick = (attachments, index) => {
    setPreviewAttachment({ attachments, index });
    setShowAttachmentPreview(true);
  }

  return (
    <>
      {!messages && (
        <div className="flex flex-col gap-8 justify-center items-center text-center h-full opacity-35">
          <div className="text-2xl md:text-4xl p-16 text-slate-200">
            Please select conversation to see messages
          </div>
          <ChatBubbleLeftRightIcon className="w-32 h-32 inline-block" />
        </div>
      )}
      {messages && (
        <>
          <ConversationHeader selectedConversation={selectedConversation} />
          <div ref={messagesCtrRef} className="flex-1 overflow-y-auto p-5">
            {localMessages.length === 0 && (
              <div className="flex justify-center items-center h-full">
                <div className="text-lg text-slate-200">
                  No messages found
                </div>
              </div>
            )}
            {localMessages.length > 0 && (
              <div className="flex-1 flex flex-col">
                <div ref={loadMoreIntersect} />
                {localMessages.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    attachmentClick={onAttachmentClick}
                  />
                ))}
              </div>
            )}
          </div>
          <MessageInput conversation={selectedConversation} />
        </>
      )}

      {previewAttachment.attachments && (
        <AttachmentPreviewModal
          attachments={previewAttachment.attachments}
          index={previewAttachment.index}
          show={showAttachmentPreview}
          onClose={() => setShowAttachmentPreview(false)}
        />
      )}
    </>
  );
}

Home.layout = (page) => {
  return (
    <AuthenticatedLayout user={page.props.auth.user}>
      <ChatLayout children={page} />
    </AuthenticatedLayout>
  )
}
export default Home;
