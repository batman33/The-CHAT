import { PencilSquareIcon } from "@heroicons/react/24/solid/index.js";
import { useEffect, useState } from "react";
import { router, usePage } from "@inertiajs/react";

import ConversationItem from "@/Components/App/ConversationItem.jsx";
import GroupModal from "@/Components/App/GroupModal.jsx";
import TextInput from "@/Components/TextInput.jsx";

import { useEventBus } from "@/EventBus.jsx";

const ChatLayout = ({ children }) => {
  const page = usePage();

  const conversations = page.props.conversations;
  const selectedConversation = page.props.selectedConversation;

  const [ localConversation, setLocalConversation ] = useState([]);
  const [ sortedConversation, setSortedConversation ] = useState([]);
  const [ onlineUsers, setOnlineUsers ] = useState({});
  const [ showGroupModal, setShowGroupModal ] = useState(false);

  const { on, emit } = useEventBus();

  const isUserOnline = (userId) => onlineUsers[userId];

  useEffect(() => {
    setSortedConversation(
      localConversation.sort((a, b) => {
        if (a.blocked_at && b.blocked_at) {
          return a.blocked_at > b.blocked_at ? 1 : -1;
        } else if (a.blocked_at) {
          return 1;
        } else if (b.blocked_at) {
          return -1;
        }

        if (a.last_message_date && b.last_message_date) {
          return b.last_message_date.localeCompare(a.last_message_date)
        } else if (a.last_message_date) {
          return -1;
        } else if (b.last_message_date) {
          return 1;
        } else {
          return 0;
        }
      }),
    );
  }, [ localConversation ]);

  useEffect(() => {
    const offCreated = on("message.created", messageCreated);
    const offDeleted = on("message.deleted", messageDeleted);

    const offGroupModal = on("GroupModal.show", () => {
      setShowGroupModal(true);
    });

    const offGroupDeleted = on("group.deleted", ({ id, name }) => {
      setLocalConversation((oldConversations) => {
        return oldConversations.filter(c => +c.id !== +id);
      });

      emit("toast.show", `Group "${name}" was deleted`);

      if (!selectedConversation || selectedConversation.is_group && parseInt(selectedConversation.id) === parseInt(id)) {
        router.visit(route("home"));
      }
    });

    return () => {
      offCreated();
      offDeleted();
      offGroupModal();
      offGroupDeleted();
    }
  }, [ on ]);

  useEffect(() => {
    if (conversations) {
      setLocalConversation(conversations);
    }
  }, [ conversations ]);

  useEffect(() => {
    Echo.join('online')
        .here((users) => {
          const onlineUsersObj = Object.fromEntries(users.map(user => [ user.id, user ]));
          setOnlineUsers(prevOnlineUsers => {
            return { ...prevOnlineUsers, ...onlineUsersObj };
          });
        })
        .joining((user) => {
          setOnlineUsers((prevOnlineUsers) => {
            const updatedUsers = { ...prevOnlineUsers };
            updatedUsers[user.id] = user;
            return updatedUsers;
          })
        })
        .leaving((user) => {
          setOnlineUsers((prevOnlineUsers) => {
            const updatedUsers = { ...prevOnlineUsers };
            delete updatedUsers[user.id];
            return updatedUsers;
          })
        })
        .error((error) => {
          console.log('error', error);
        });

    return () => {
      Echo.leave('online');
    };
  }, []);

  const messageCreated = (message) => {
    setLocalConversation((oldUsers) => {
      return oldUsers.map(user => {
        if (
          message.receiver_id &&
          !user.is_group &&
          (
            user.id === parseInt(message.sender_id) ||
            user.id === parseInt(message.receiver_id)
          )
        ) {
          return {
            ...user,
            last_message: message.message,
            last_message_date: message.created_at,
          };
        }
        if (
          message.group_id &&
          user.is_group &&
          user.id === parseInt(message.group_id)
        ) {
          return {
            ...user,
            last_message: message.message,
            last_message_date: message.created_at,
          };
        }

        return user;
      });
    });
  };

  const messageDeleted = ({ prevMessage }) => {
    if (!prevMessage) {
      return;
    }

    messageCreated(prevMessage)

    // setLocalConversation((oldUsers) => {
    //   return oldUsers.map((user) => {
    //     if (
    //       prevMessage.receiver_id &&
    //       !user.is_group &&
    //       (
    //         user.id === parseInt(prevMessage.sender_id) ||
    //         user.id === parseInt(prevMessage.receiver_id)
    //       )
    //     ) {
    //       return {
    //         ...user,
    //         last_message: prevMessage.message,
    //         last_message_date: prevMessage.created_at,
    //       };
    //     }
    //     if (
    //       prevMessage.group_id &&
    //       user.is_group &&
    //       user.id === parseInt(prevMessage.group_id)
    //     ) {
    //       return {
    //         ...user,
    //         last_message: prevMessage.message,
    //         last_message_date: prevMessage.created_at,
    //       };
    //     }
    //
    //     return user;
    //   });
    // });
  };

  const onSearch = (ev) => {
    const search = ev.target.value.toLowerCase();
    setLocalConversation(
      conversations.filter((conversation) => {
        return conversation.name.toLowerCase().includes(search);
      }),
    );
  };

  return (
    <>
      <div className="flex-1 w-full flex overflow-hidden">
        <div className={`transition-all w-full sm:w-[220px] md:w-[300px] bg-slate-800 flex flex-col overflow-hidden ${
          selectedConversation ? "-ml-[100%] sm:ml-0" : ""
        }`}>
          <div className="flex items-center justify-between py-2 px-3 text-xl font-medium text-gray-200">
            My Conversations
            <div className="tooltip tooltip-left" data-tip="Create new Group">
              <button type="button" className="text-gray-400 hover:text-gray-200" onClick={() => setShowGroupModal(true)}>
                <PencilSquareIcon className="w-4 h-4 inline-block ml-2" />
              </button>
            </div>
          </div>
          <div className="p-3">
            <TextInput onKeyUp={onSearch} placeholder="Filter users and groups" className="w-full" />
          </div>
          <div className="flex-1 overflow-auto">
            {sortedConversation && sortedConversation.map((conversation) => (
              <ConversationItem
                key={`${conversation.is_group ? 'group_' : 'user_'}${conversation.id}`}
                conversation={conversation}
                online={!!isUserOnline(conversation.id)}
                selectedConversation={selectedConversation}
              />
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
      <GroupModal show={showGroupModal} onClose={() => setShowGroupModal(false)} />
    </>
  )
}

export default ChatLayout;
