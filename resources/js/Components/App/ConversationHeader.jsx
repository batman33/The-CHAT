import GroupDescriptionPopover from "@/Components/App/GroupDescriptionPopover.jsx";
import GroupUsersPopover from "@/Components/App/GroupUsersPopover.jsx";
import { useEventBus } from "@/EventBus.jsx";
import { Link, usePage } from "@inertiajs/react";
import { ArrowLeftIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/solid/index.js";
import UserAvatar from "@/Components/App/UserAvatar.jsx";
import GroupAvatar from "@/Components/App/GroupAvatar.jsx";

export const ConversationHeader = ({ selectedConversation }) => {
  const page = usePage();

  const authUser = page.props.auth.user;

  const { emit } = useEventBus();

  const onDeleteGroup = () => {
    if (!window.confirm("Are you sure you want to delete this group?")) {
      return;
    }

    axios.delete(route("group.destroy", selectedConversation.id)).then((res) => {
      emit("toast.show", res.data.message);
    }).catch((error) => {
      console.log(error);
    });
  }

  return (
    <>
      {selectedConversation && (
        <div className="p-3 flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Link href={route("home")} className="inline-block sm:hidden">
              <ArrowLeftIcon className="w-6" />
            </Link>
            {selectedConversation.is_user && (
              <UserAvatar user={selectedConversation} />
            )}
            {selectedConversation.is_group && <GroupAvatar />}
            <div>
              <h3>{selectedConversation.name}</h3>
              {selectedConversation.is_group && (
                <p className="text-xs text-gray-500">
                  {selectedConversation.users.length} members
                </p>
              )}
            </div>
          </div>
          {selectedConversation.is_group && (
            <div className="flex gap-3">
              <GroupDescriptionPopover description={selectedConversation.description} />
              <GroupUsersPopover users={selectedConversation.users} />
              {selectedConversation.owner_id === parseInt(authUser.id) && (
                <>
                  <div className="tooltip tooltip-left" data-tip="Edit Group">
                    <button type="button" className="text-gray-400 hover:text-gray-200" onClick={() => emit("GroupModal.show", selectedConversation)}>
                      <PencilSquareIcon className="w-4" />
                    </button>
                  </div>
                  <div className="tooltip tooltip-left" data-tip="Delete Group">
                    <button type="button" className="text-gray-400 hover:text-gray-200" onClick={onDeleteGroup}>
                      <TrashIcon className="w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
