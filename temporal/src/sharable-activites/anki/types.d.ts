
export type NoteModel = 'Basic (and reversed card)' | 'Basic (type in the answer)' | 'Basic' | 'Cloze' | ({} & string);

export type NoteMedia = {
  data?: string;
  fields: string[];
  path?: string;
  skipHash?: false;
  url?: string;
};

export type Note = {
  audio?: NoteMedia[];
  deckName: string;
  fields: Record<string, string>;
  modelName: NoteModel;
  picture?: NoteMedia[];
  tags?: string[];
  video?: NoteMedia[];
};

export type NoteWithCreationOptions = {
  options?: {
      allowDuplicate?: boolean;
      duplicateScope?: 'deck' | ({} & string);
      duplicateScopeOptions?: {
          checkAllModels?: boolean;
          checkChildren?: boolean;
          deckName?: null | string;
      };
  };
} & Note;