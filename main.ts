import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"flower-2",
			"Start poetry memorizer",
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new SampleModal(this.app).open();
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	private poem: string; // Declare the poem property

	constructor(app: App) {
		super(app);
		this.poem = ""; // Initialize the poem property

		// create blurred background
		const background = document.createElement("div");
		background.style.position = "fixed";
		background.style.top = "0";
		background.style.left = "0";
		background.style.width = "100%";
		background.style.height = "100%";
		background.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
		background.style.zIndex = "10";
		background.style.backdropFilter = "blur(10px)";
		// set id
		background.id = "poetry-memorizer-background";
		document.body.appendChild(background);
	}

	displayRandomLine() {
		const self = this;
		const { contentEl } = this;
		contentEl.empty();

		const lines = this.poem.split("\n");
		// remove lines that are empty or only contain whitespace, or are ```
		const filteredLines = lines.filter(
			(line) => line.trim() !== "" && line.trim() !== "```"
		);
		const randomLine =
			filteredLines[Math.floor(Math.random() * filteredLines.length)];
		// get the line above
		const lineAbove = lines[lines.indexOf(randomLine) - 1];

		// get a random word from the randomLine, and replace it with an input (cloze deletion)
		let words = randomLine.split(" ");
		// exclude words that are shorter than 3 characters
		words = words.filter((word) => word.length > 3);

		const randomWord = words[Math.floor(Math.random() * words.length)];

		const firstPartOfClozeLine = randomLine.split(randomWord)[0];
		const secondPartOfClozeLine = randomLine.split(randomWord)[1];

		function revealAnswer(randomWord: string) {
			// delete content of cloze line
			clozeLine.empty();
			answerButtonWrapper.empty();
			// wrap the random word in bold and cursive tags
			contentEl
				.createEl("span", {
					text: firstPartOfClozeLine,
				})
				.createEl("span", {
					text: randomWord,
					cls: "cloze-word",
				})
			contentEl
				.createEl("span", {
					text: secondPartOfClozeLine,
				})
				.createEl("button", {
					text: "Practice next line",
					cls: "plugin-button",
				})
				.addEventListener("click", () => {
					self.displayRandomLine();
				});
		}

		contentEl.createEl("div", {
			text: lineAbove,
		});
		const clozeLine = contentEl.createEl("div", {});

		clozeLine.createEl("span", {
			text: firstPartOfClozeLine,
		});
		clozeLine.createEl("input", {
			text: "",
		});
		clozeLine.createEl("span", {
			text: secondPartOfClozeLine,
		});

		const answerButtonWrapper = contentEl.createEl("div", {});

		// add a button to display another random line
		const checkAnswerButton = answerButtonWrapper
			.createEl("button", {
				text: "Check answer",
				cls: "plugin-button",
			})
			.addEventListener("click", () => {
				revealAnswer(randomWord);
			});
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.id = "poetry-memorizer";

		// get currently open note
		const activeLeaf = this.app.workspace.activeLeaf;
		if (activeLeaf) {
			const currentFile = activeLeaf.view.file;
			if (currentFile) {
				// get note content
				this.app.vault.read(currentFile).then((content) => {
					this.poem = content;
					// remove frontmatter
					const metadata =
						app.metadataCache.getFileCache(currentFile);
					if (metadata) {
						console.log("found metadata", metadata);
						this.poem = this.poem.split("---")[2];
					}

					this.displayRandomLine();
				});
				// if there still is (---), only take the first part
				this.poem = this.poem.split("---")[0];
			}
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
		// remove #"poetry-memorizer-background"
		const background = document.getElementById(
			"poetry-memorizer-background"
		);
		if (background) {
			background.remove();
		}
	}
}
