import { useEventBus } from "@/EventBus.jsx";
import { Menu, Transition } from "@headlessui/react";
import { EllipsisVerticalIcon, LockClosedIcon, LockOpenIcon, ShieldCheckIcon, UserIcon } from "@heroicons/react/24/solid/index.js";
import { Fragment } from "react";

const UserOptionsDropdown = ({ conversation }) => {
  const { emit } = useEventBus();

  const onBlockUser = () => {
    if (!conversation.is_user) {
      return;
    }

    axios.post(route("user.blockUnblock", conversation.id)).then((res) => {
      emit("toast.show", res.data.message);
    }).catch((error) => {
      console.log(error);
    });
  }

  const changeUserRole = () => {
    if (!conversation.is_user) {
      return;
    }

    axios.post(route("user.changeRole", conversation.id)).then((res) => {
      emit("toast.show", res.data.message);
    }).catch((error) => {
      console.log(error);
    });
  }

  return (
    <div>
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button className="flex justify-center items-center w-8 h-8 rounded-full hover:bg-black/40">
            <EllipsisVerticalIcon className="h-5 w-5" />
          </Menu.Button>
        </div>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transition opacity-0 scale-95"
          enterTo="transition opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transition opacity-100 scale-100"
          leaveTo="transition opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 mt-2 w-48 rounded-md bg-gray-800 shadow-lg z-50">
            <div className="px-1 py-1">
              <Menu.Item>
                {({ active }) => (
                  <button onClick={onBlockUser}
                          className={`${active ? 'bg-black/30 text-white' : 'text-gray-100'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}>
                    {conversation.blocked_at && (
                      <>
                        <LockOpenIcon className="w-4 h-4 mr-2" />
                        Unblock User
                      </>
                    )}
                    {!conversation.blocked_at && (
                      <>
                        <LockClosedIcon className="w-4 h-4 mr-2" />
                        Block User
                      </>
                    )}
                  </button>
                )}
              </Menu.Item>
            </div>
            <div className="px-1 py-1">
              <Menu.Item>
                {({ active }) => (
                  <button onClick={changeUserRole}
                          className={`${active ? 'bg-black/30 text-white' : 'text-gray-100'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}>
                    {conversation.is_admin && (
                      <>
                        <UserIcon className="w-4 h-4 mr-2" />
                        Make Regular User
                      </>
                    )}
                    {!conversation.is_admin && (
                      <>
                        <ShieldCheckIcon className="w-4 h-4 mr-2" />
                        MakeAdmin
                      </>
                    )}
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  )
}

export default UserOptionsDropdown;
