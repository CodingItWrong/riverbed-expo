import set from 'lodash.set';
import {useState} from 'react';
import {View} from 'react-native';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import DropdownField from '../../components/DropdownField';
import ErrorMessage from '../../components/ErrorMessage';
import TextField from '../../components/TextField';
import sharedStyles, {useColumnStyle} from '../../components/sharedStyles';
import {useDeleteBoard, useUpdateBoard} from '../../data/boards';
import COLOR_THEMES from '../../enums/colorThemes';
import ICONS from '../../enums/icons';

export default function EditBoardForm({board, onSave, onDelete, onCancel}) {
  const [attributes, setAttributes] = useState(board.attributes);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const {
    mutate: updateBoard,
    isLoading: isSaving,
    isError: isUpdateError,
  } = useUpdateBoard(board);
  const handleUpdateBoard = () => updateBoard(attributes, {onSuccess: onSave});

  const {
    mutate: deleteBoard,
    isLoading: isDeleting,
    isError: isDeleteError,
  } = useDeleteBoard(board);
  const handleDeleteBoard = () => deleteBoard(null, {onSuccess: onDelete});

  function updateAttribute(path, value) {
    setAttributes(oldAttributes => {
      const newAttributes = {...oldAttributes};
      set(newAttributes, path, value);
      return newAttributes;
    });
  }

  const isLoading = isSaving || isDeleting;

  const columnStyle = useColumnStyle();

  function getErrorMessage() {
    if (isUpdateError) {
      return 'An error occurred while saving the board';
    } else if (isDeleteError) {
      return 'An error occurred while deleting the board';
    }
  }

  const icon = attributes.icon
    ? ICONS.find(i => i.key === attributes.icon)
    : null;

  const colorTheme = COLOR_THEMES[attributes['color-theme']];

  return (
    <View style={sharedStyles.columnPadding}>
      <ConfirmationDialog
        destructive
        open={confirmingDelete}
        title="Delete Board?"
        message={`Are you sure you want to delete board "${attributes.name}"? Data will not be able to be recovered.`}
        confirmButtonLabel="Yes, Delete Board"
        onConfirm={handleDeleteBoard}
        onDismiss={() => setConfirmingDelete(false)}
      />
      <Card style={columnStyle}>
        <TextField
          label="Name"
          value={attributes.name ?? ''}
          onChangeText={value => updateAttribute('name', value)}
          testID="text-input-board-name"
          style={sharedStyles.mt}
        />
        <DropdownField
          fieldLabel="Color Theme"
          emptyLabel="(default)"
          value={colorTheme}
          onValueChange={value =>
            updateAttribute('color-theme', value?.key ?? null)
          }
          options={Object.values(COLOR_THEMES)}
          style={sharedStyles.mt}
        />
        <DropdownField
          fieldLabel="Icon"
          emptyLabel="(none)"
          value={icon}
          onValueChange={value => updateAttribute('icon', value?.key ?? null)}
          options={ICONS}
          style={sharedStyles.mt}
        />
        <ErrorMessage>{getErrorMessage()}</ErrorMessage>
        <Button onPress={onCancel} disabled={isLoading} style={sharedStyles.mt}>
          Cancel
        </Button>
        <Button
          onPress={() => setConfirmingDelete(true)}
          disabled={isLoading}
          style={sharedStyles.mt}
        >
          Delete Board
        </Button>
        <Button
          mode="primary"
          onPress={handleUpdateBoard}
          disabled={isLoading}
          style={sharedStyles.mt}
        >
          Save Board
        </Button>
      </Card>
    </View>
  );
}
