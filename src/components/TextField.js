import {TextInput as PaperTextInput} from 'react-native-paper';
import sharedStyles from './sharedStyles';

export default function TextField({
  label,
  value,
  onChangeText,
  disabled,
  multiline,
  keyboardType,
  testID,
  style,
}) {
  return (
    <PaperTextInput
      // TODO: see if removing "multiline" helps with scrolling
      // multiline
      label={label}
      testID={testID}
      value={value}
      onChangeText={onChangeText}
      disabled={disabled}
      multiline={multiline}
      keyboardType={keyboardType}
      style={[sharedStyles.textInput, style]}
    />
  );
}
