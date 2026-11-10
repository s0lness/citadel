//! The menu bar's pure half: which command each item sends, the state the
//! frontend pushes, and the labels and checkmarks that state produces.
//! Only macOS has a menu bar to show them; the tests run everywhere.
#![cfg_attr(not(target_os = "macos"), allow(dead_code))]

use serde::{Deserialize, Deserializer, Serialize};

/// A menu choice delivered to the library window.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "kebab-case")]
pub enum MenuCommand {
    NewShelf,
    AddLibrary,
    ShowLibraryInFileManager,
    Find,
    Undo,
    Redo,
    SelectAll,
    BookShowDetails,
    BookRead,
    BookEdit,
    BookMarkFinished,
    BookShowInFileManager,
    BookCopyTitle,
    BookDelete,
    ToggleSidebar,
    ToggleUnreadOnly,
    SortNameAz,
    SortNameZa,
    SortAuthorAz,
    SortAuthorZa,
    GoAllBooks,
    GoAuthors,
    GoSeries,
    GoTags,
    GoPublishers,
    GoBack,
    GoForward,
    RestartToUpdate,
    #[serde(rename = "switchLibrary")]
    SwitchLibrary(String),
}

const SWITCH_LIBRARY_PREFIX: &str = "switch-library:";

const SIMPLE_COMMANDS: [MenuCommand; 28] = [
    MenuCommand::NewShelf,
    MenuCommand::AddLibrary,
    MenuCommand::ShowLibraryInFileManager,
    MenuCommand::Find,
    MenuCommand::Undo,
    MenuCommand::Redo,
    MenuCommand::SelectAll,
    MenuCommand::BookShowDetails,
    MenuCommand::BookRead,
    MenuCommand::BookEdit,
    MenuCommand::BookMarkFinished,
    MenuCommand::BookShowInFileManager,
    MenuCommand::BookCopyTitle,
    MenuCommand::BookDelete,
    MenuCommand::ToggleSidebar,
    MenuCommand::ToggleUnreadOnly,
    MenuCommand::SortNameAz,
    MenuCommand::SortNameZa,
    MenuCommand::SortAuthorAz,
    MenuCommand::SortAuthorZa,
    MenuCommand::GoAllBooks,
    MenuCommand::GoAuthors,
    MenuCommand::GoSeries,
    MenuCommand::GoTags,
    MenuCommand::GoPublishers,
    MenuCommand::GoBack,
    MenuCommand::GoForward,
    MenuCommand::RestartToUpdate,
];

impl MenuCommand {
    /// The menu item id, which is also the command's wire name.
    pub fn menu_id(&self) -> String {
        match self {
            Self::SwitchLibrary(library_id) => format!("{SWITCH_LIBRARY_PREFIX}{library_id}"),
            simple => simple.simple_id().to_string(),
        }
    }

    fn simple_id(&self) -> &'static str {
        match self {
            Self::NewShelf => "new-shelf",
            Self::AddLibrary => "add-library",
            Self::ShowLibraryInFileManager => "show-library-in-file-manager",
            Self::Find => "find",
            Self::Undo => "undo",
            Self::Redo => "redo",
            Self::SelectAll => "select-all",
            Self::BookShowDetails => "book-show-details",
            Self::BookRead => "book-read",
            Self::BookEdit => "book-edit",
            Self::BookMarkFinished => "book-mark-finished",
            Self::BookShowInFileManager => "book-show-in-file-manager",
            Self::BookCopyTitle => "book-copy-title",
            Self::BookDelete => "book-delete",
            Self::ToggleSidebar => "toggle-sidebar",
            Self::ToggleUnreadOnly => "toggle-unread-only",
            Self::SortNameAz => "sort-name-az",
            Self::SortNameZa => "sort-name-za",
            Self::SortAuthorAz => "sort-author-az",
            Self::SortAuthorZa => "sort-author-za",
            Self::GoAllBooks => "go-all-books",
            Self::GoAuthors => "go-authors",
            Self::GoSeries => "go-series",
            Self::GoTags => "go-tags",
            Self::GoPublishers => "go-publishers",
            Self::GoBack => "go-back",
            Self::GoForward => "go-forward",
            Self::RestartToUpdate => "restart-to-update",
            Self::SwitchLibrary(_) => SWITCH_LIBRARY_PREFIX,
        }
    }

    pub fn from_menu_id(id: &str) -> Option<Self> {
        if let Some(library_id) = id.strip_prefix(SWITCH_LIBRARY_PREFIX) {
            return Some(Self::SwitchLibrary(library_id.to_string()));
        }
        SIMPLE_COMMANDS
            .iter()
            .find(|command| command.simple_id() == id)
            .cloned()
    }
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum MenuSortOrder {
    #[default]
    NameAz,
    NameZa,
    AuthorAz,
    AuthorZa,
}

impl MenuSortOrder {
    pub const ALL: [MenuSortOrder; 4] = [
        MenuSortOrder::NameAz,
        MenuSortOrder::NameZa,
        MenuSortOrder::AuthorAz,
        MenuSortOrder::AuthorZa,
    ];

    pub fn label(self) -> &'static str {
        match self {
            Self::NameAz => "Name (A–Z)",
            Self::NameZa => "Name (Z–A)",
            Self::AuthorAz => "Author (A–Z)",
            Self::AuthorZa => "Author (Z–A)",
        }
    }

    pub fn command(self) -> MenuCommand {
        match self {
            Self::NameAz => MenuCommand::SortNameAz,
            Self::NameZa => MenuCommand::SortNameZa,
            Self::AuthorAz => MenuCommand::SortAuthorAz,
            Self::AuthorZa => MenuCommand::SortAuthorZa,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
pub struct MenuLibrary {
    pub id: String,
    pub name: String,
    pub active: bool,
}

/// Everything the menu bar shows that only the frontend knows.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct MenuState {
    pub selected_book_count: u32,
    pub selection_all_finished: bool,
    pub sidebar_visible: bool,
    pub unread_only: bool,
    pub sort_order: MenuSortOrder,
    pub libraries: Vec<MenuLibrary>,
    pub update_ready_version: Option<String>,
    pub editing_book: bool,
}

impl Default for MenuState {
    fn default() -> Self {
        Self {
            selected_book_count: 0,
            selection_all_finished: false,
            sidebar_visible: true,
            unread_only: false,
            sort_order: MenuSortOrder::NameAz,
            libraries: Vec::new(),
            update_ready_version: None,
            editing_book: false,
        }
    }
}

/// Keeps "absent" (leave as is) apart from `null` (no update ready).
fn present<'de, D, T>(deserializer: D) -> Result<Option<T>, D::Error>
where
    D: Deserializer<'de>,
    T: Deserialize<'de>,
{
    T::deserialize(deserializer).map(Some)
}

/// The fields of [`MenuState`] that changed; absent fields stay as they were.
#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase", default)]
pub struct MenuStatePatch {
    #[specta(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_book_count: Option<u32>,
    #[specta(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selection_all_finished: Option<bool>,
    #[specta(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sidebar_visible: Option<bool>,
    #[specta(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unread_only: Option<bool>,
    #[specta(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sort_order: Option<MenuSortOrder>,
    #[specta(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub libraries: Option<Vec<MenuLibrary>>,
    #[specta(optional)]
    #[serde(deserialize_with = "present", skip_serializing_if = "Option::is_none")]
    pub update_ready_version: Option<Option<String>>,
    #[specta(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub editing_book: Option<bool>,
}

impl MenuState {
    pub fn with(&self, patch: MenuStatePatch) -> Self {
        let current = self.clone();
        Self {
            selected_book_count: patch
                .selected_book_count
                .unwrap_or(current.selected_book_count),
            selection_all_finished: patch
                .selection_all_finished
                .unwrap_or(current.selection_all_finished),
            sidebar_visible: patch.sidebar_visible.unwrap_or(current.sidebar_visible),
            unread_only: patch.unread_only.unwrap_or(current.unread_only),
            sort_order: patch.sort_order.unwrap_or(current.sort_order),
            libraries: patch.libraries.unwrap_or(current.libraries),
            update_ready_version: patch
                .update_ready_version
                .unwrap_or(current.update_ready_version),
            editing_book: patch.editing_book.unwrap_or(current.editing_book),
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ItemView {
    pub label: String,
    pub enabled: bool,
}

impl ItemView {
    fn new(label: impl Into<String>, enabled: bool) -> Self {
        Self {
            label: label.into(),
            enabled,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct BookMenuView {
    pub show_details: ItemView,
    pub read: ItemView,
    pub edit: ItemView,
    pub mark_finished: ItemView,
    pub show_in_file_manager: ItemView,
    pub copy_title: ItemView,
    pub delete: ItemView,
}

/// What every stateful item shows, derived from [`MenuState`].
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct MenuView {
    pub book: BookMenuView,
    pub sidebar_label: &'static str,
    pub unread_only: bool,
    pub sort_order: MenuSortOrder,
    pub libraries: Vec<MenuLibrary>,
    pub restart_to_update: bool,
    pub editing_book: bool,
}

pub const RESTART_TO_UPDATE_LABEL: &str = "Restart to Update";

fn books(count: u32) -> String {
    format!("{count} Books")
}

/// Labels for the Book menu. Read, Mark and Delete act on the whole
/// selection; the rest need exactly one book.
pub fn book_menu_view(selected: u32, all_finished: bool, file_manager_name: &str) -> BookMenuView {
    let single = selected == 1;
    let any = selected > 0;
    let plural = selected > 1;
    let finished = if all_finished {
        "Unfinished"
    } else {
        "Finished"
    };
    BookMenuView {
        show_details: ItemView::new("Show Details", single),
        read: ItemView::new(
            if plural {
                format!("Read {}", books(selected))
            } else {
                "Read".to_string()
            },
            any,
        ),
        edit: ItemView::new("Edit…", single),
        mark_finished: ItemView::new(
            if plural {
                format!("Mark {} as {finished}", books(selected))
            } else {
                format!("Mark as {finished}")
            },
            any,
        ),
        show_in_file_manager: ItemView::new(format!("Show in {file_manager_name}"), single),
        copy_title: ItemView::new("Copy Title", single),
        delete: ItemView::new(
            if plural {
                format!("Delete {}…", books(selected))
            } else {
                "Delete…".to_string()
            },
            any,
        ),
    }
}

pub fn menu_view(state: &MenuState, file_manager_name: &str) -> MenuView {
    MenuView {
        book: book_menu_view(
            state.selected_book_count,
            state.selection_all_finished,
            file_manager_name,
        ),
        sidebar_label: if state.sidebar_visible {
            "Hide Sidebar"
        } else {
            "Show Sidebar"
        },
        unread_only: state.unread_only,
        sort_order: state.sort_order,
        libraries: state.libraries.clone(),
        restart_to_update: state.update_ready_version.is_some(),
        editing_book: state.editing_book,
    }
}

/// Which parts of the menu bar must be touched to go from one view to the
/// next. `None` means nothing has been applied yet, so everything is.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct MenuChanges {
    pub book: bool,
    pub sidebar: bool,
    pub unread_only: bool,
    pub sort_order: bool,
    pub libraries: bool,
    pub restart_to_update: bool,
    pub editing_book: bool,
}

#[cfg(test)]
impl MenuChanges {
    pub fn any(&self) -> bool {
        self.book
            || self.sidebar
            || self.unread_only
            || self.sort_order
            || self.libraries
            || self.restart_to_update
            || self.editing_book
    }
}

pub fn menu_changes(previous: Option<&MenuView>, next: &MenuView) -> MenuChanges {
    let Some(previous) = previous else {
        return MenuChanges {
            book: true,
            sidebar: true,
            unread_only: true,
            sort_order: true,
            libraries: true,
            restart_to_update: true,
            editing_book: true,
        };
    };
    MenuChanges {
        book: previous.book != next.book,
        sidebar: previous.sidebar_label != next.sidebar_label,
        unread_only: previous.unread_only != next.unread_only,
        sort_order: previous.sort_order != next.sort_order,
        libraries: previous.libraries != next.libraries,
        restart_to_update: previous.restart_to_update != next.restart_to_update,
        editing_book: previous.editing_book != next.editing_book,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn menu_ids_are_the_wire_names() {
        for command in SIMPLE_COMMANDS {
            let wire = serde_json::to_value(&command).unwrap();
            assert_eq!(wire, serde_json::json!(command.menu_id()));
            assert_eq!(MenuCommand::from_menu_id(&command.menu_id()), Some(command));
        }
    }

    #[test]
    fn library_switches_carry_the_library_id() {
        let command = MenuCommand::SwitchLibrary("a:b".into());
        assert_eq!(command.menu_id(), "switch-library:a:b");
        assert_eq!(
            MenuCommand::from_menu_id("switch-library:a:b"),
            Some(command.clone())
        );
        assert_eq!(
            serde_json::to_value(&command).unwrap(),
            serde_json::json!({ "switchLibrary": "a:b" })
        );
    }

    #[test]
    fn unknown_ids_are_not_commands() {
        assert_eq!(MenuCommand::from_menu_id("settings"), None);
        assert_eq!(MenuCommand::from_menu_id("add-book"), None);
    }

    #[test]
    fn patches_change_only_what_they_name() {
        let patch: MenuStatePatch =
            serde_json::from_value(serde_json::json!({ "selectedBookCount": 3 })).unwrap();
        let state = MenuState {
            update_ready_version: Some("1.4".into()),
            ..MenuState::default()
        }
        .with(patch);
        assert_eq!(state.selected_book_count, 3);
        assert_eq!(state.update_ready_version.as_deref(), Some("1.4"));
        assert!(state.sidebar_visible);
    }

    #[test]
    fn a_null_update_version_clears_it_and_an_absent_one_keeps_it() {
        let ready = MenuState {
            update_ready_version: Some("1.4".into()),
            ..MenuState::default()
        };
        let cleared: MenuStatePatch =
            serde_json::from_value(serde_json::json!({ "updateReadyVersion": null })).unwrap();
        assert_eq!(ready.with(cleared).update_ready_version, None);
        let untouched: MenuStatePatch = serde_json::from_value(serde_json::json!({})).unwrap();
        assert_eq!(
            ready.with(untouched).update_ready_version.as_deref(),
            Some("1.4")
        );
    }

    #[test]
    fn patches_read_the_frontend_shape() {
        let patch: MenuStatePatch = serde_json::from_value(serde_json::json!({
            "sortOrder": "authorZa",
            "libraries": [{ "id": "l1", "name": "Books", "active": true }],
            "editingBook": true,
        }))
        .unwrap();
        let state = MenuState::default().with(patch);
        assert_eq!(state.sort_order, MenuSortOrder::AuthorZa);
        assert_eq!(state.libraries.len(), 1);
        assert!(state.editing_book);
    }

    #[test]
    fn the_book_menu_is_disabled_without_a_selection() {
        let view = book_menu_view(0, false, "Finder");
        for item in [
            &view.show_details,
            &view.read,
            &view.edit,
            &view.mark_finished,
            &view.show_in_file_manager,
            &view.copy_title,
            &view.delete,
        ] {
            assert!(!item.enabled, "{} should be disabled", item.label);
        }
        assert_eq!(view.delete.label, "Delete…");
    }

    #[test]
    fn one_book_gets_singular_labels() {
        let view = book_menu_view(1, false, "Finder");
        assert_eq!(view.read, ItemView::new("Read", true));
        assert_eq!(view.mark_finished, ItemView::new("Mark as Finished", true));
        assert_eq!(
            view.show_in_file_manager,
            ItemView::new("Show in Finder", true)
        );
        assert_eq!(view.delete, ItemView::new("Delete…", true));
        assert!(view.edit.enabled && view.show_details.enabled && view.copy_title.enabled);
    }

    #[test]
    fn several_books_get_plural_labels_and_single_book_items_disable() {
        let view = book_menu_view(2, true, "Finder");
        assert_eq!(view.read, ItemView::new("Read 2 Books", true));
        assert_eq!(
            view.mark_finished,
            ItemView::new("Mark 2 Books as Unfinished", true)
        );
        assert_eq!(view.delete, ItemView::new("Delete 2 Books…", true));
        assert!(!view.show_details.enabled);
        assert!(!view.edit.enabled);
        assert!(!view.show_in_file_manager.enabled);
        assert!(!view.copy_title.enabled);
    }

    #[test]
    fn the_sidebar_item_names_what_it_will_do() {
        let shown = menu_view(&MenuState::default(), "Finder");
        assert_eq!(shown.sidebar_label, "Hide Sidebar");
        let hidden = menu_view(
            &MenuState {
                sidebar_visible: false,
                ..MenuState::default()
            },
            "Finder",
        );
        assert_eq!(hidden.sidebar_label, "Show Sidebar");
    }

    #[test]
    fn the_first_apply_touches_everything() {
        let view = menu_view(&MenuState::default(), "Finder");
        let changes = menu_changes(None, &view);
        assert!(changes.book && changes.libraries && changes.editing_book);
    }

    #[test]
    fn later_applies_touch_only_what_changed() {
        let before = menu_view(&MenuState::default(), "Finder");
        assert!(!menu_changes(Some(&before), &before).any());

        let after = menu_view(
            &MenuState {
                selected_book_count: 1,
                update_ready_version: Some("1.4".into()),
                ..MenuState::default()
            },
            "Finder",
        );
        let changes = menu_changes(Some(&before), &after);
        assert_eq!(
            changes,
            MenuChanges {
                book: true,
                restart_to_update: true,
                ..MenuChanges::default()
            }
        );
    }
}
