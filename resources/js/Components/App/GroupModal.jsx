import UserPicker from "@/Components/App/UserPicker.jsx";
import InputError from "@/Components/InputError.jsx";
import InputLabel from "@/Components/InputLabel.jsx";
import Modal from "@/Components/Modal.jsx";
import PrimaryButton from "@/Components/PrimaryButton.jsx";
import SecondaryButton from "@/Components/SecondaryButton.jsx";
import TextAreaInput from "@/Components/TextAreaInput.jsx";
import TextInput from "@/Components/TextInput.jsx";
import { useEventBus } from "@/EventBus.jsx";
import { useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";

const GroupModal = ({ show = false, onClose = () => {} }) => {
  const [ group, setGroup ] = useState({})

  const page = usePage();

  const { on, emit } = useEventBus();

  const conversations = page.props.conversations;

  const { data, setData, processing, reset, post, put, errors } = useForm({
                                                                            id: "",
                                                                            name: "",
                                                                            description: "",
                                                                            user_ids: [],
                                                                          });

  useEffect(() => {
    const offGroupModal = on("GroupModal.show", (group) => {
      setData({
                id: group.id,
                name: group.name,
                description: group.description,
                user_ids: group.users.filter(user => group.owner_id !== user.id).map(user => user.id),
              });
      setGroup(group);
    });

    return () => {
      offGroupModal();
    }
  }, [ on ]);

  const users = conversations.filter(conversation => !conversation.is_group);

  const createOrUpdateGroup = (event) => {
    event.preventDefault();

    if (group.id) {
      put(route("group.update", group.id), {
        onSuccess: () => {
          emit("toast.show", `Group "${data.name}" was updated`);
          closeModal();
        },
      });

      return;
    }

    post(route("group.store"), {
      onSuccess: () => {
        emit("toast.show", `Group "${data.name}" was created`);
        closeModal();
      },
    })
  }

  const closeModal = () => {
    reset();
    onClose();
  }

  return (
    <Modal show={show} onClose={closeModal}>
      <form onSubmit={createOrUpdateGroup} className="p-6 overflow-y-auto">
        <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100">
          {group.id ? `Edit group "${group.name}"` : "Create new Group"}
        </h2>

        <div className="mt-8">
          <InputLabel value="Select Users" />
          <UserPicker
            value={users.filter((user) => user.id !== group.owner_id && data.user_ids.includes(user.id)) || []}
            options={users}
            onSelect={(users) => setData("user_ids", users.map(user => user.id))}
          />
          <InputError className="mt-2" message={errors.user_ids} />
        </div>

        <div className="mt-8">
          <InputLabel htmlFor="name" value="Name" />
          <TextInput
            id="name"
            className="mt-1 block w-full"
            value={data.name}
            disabled={!!group.id}
            onChange={(event) => {
              setData("name", event.target.value);
            }}
            required
            isFocused
          />
          <InputError className="mt-2" message={errors.name} />
        </div>

        <div className="mt-8">
          <InputLabel htmlFor="description" value="Description" />
          <TextAreaInput
            id="description"
            className="mt-1 block w-full"
            value={data.description || ""}
            disabled={!!group.id}
            onChange={(event) => setData("description", event.target.value)}
          />
          <InputError className="mt-2" message={errors.description} />
        </div>

        <SecondaryButton className="mt-6 flex justify-end" onClick={closeModal}>
          Cancel
        </SecondaryButton>
        <PrimaryButton className="ms-3" disabled={processing}>
          {group.id ? "Update" : "Create"}
        </PrimaryButton>
      </form>
    </Modal>
  )
}
export default GroupModal;
