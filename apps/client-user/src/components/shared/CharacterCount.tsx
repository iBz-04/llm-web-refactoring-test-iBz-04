/**
 * @file apps/client-user/src/components/shared/CharacterCount.tsx
 * @contents React UI component (CharacterCount).
 * @use Composed into client routes and layout under the same app.
 */

import * as stylex from "@stylexjs/stylex";
import { colors, spacing } from "../../tokens.stylex";

const styles = stylex.create({
	container: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
	},
	count: {
		fontSize: "0.875rem",
	},
	normal: {
		color: colors.gray500,
	},
	warning: {
		color: colors.yellow600,
	},
	error: {
		color: colors.red600,
	},
});

export function CharacterCount({ count, max }: { count: number; max: number }) {
	const percentage = (count / max) * 100;
	const isNearLimit = percentage > 90;
	const isOverLimit = count > max;

	const colorStyle = isOverLimit ? styles.error : isNearLimit ? styles.warning : styles.normal;

	return (
		<div {...stylex.props(styles.container)}>
			<span {...stylex.props(styles.count, colorStyle)}>
				{count}/{max}
			</span>
		</div>
	);
}
