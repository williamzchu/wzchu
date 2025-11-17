import Code from "../../Code";
import CodeFunc from "../../CodeFunc";

export default function Resizing() {
    return <div>
        There are some circustances where the swap chain will not be compatible with the window surface, such as resizes or minimizes.
        Therefore, we will need to recreate the swap chain when that happens. 

<Code>{
`void cleanupSwapChain() {
	swapChainImageViews.clear();
	swapChain = nullptr;
}

void recreateSwapChain()
{
	int width = 0, height = 0;
	glfwGetFramebufferSize(window, &width, &height);
	while (width == 0 || height == 0)
	{
		glfwGetFramebufferSize(window, &width, &height);
		glfwWaitEvents();
	}

	device.waitIdle();

	cleanupSwapChain();
	createSwapChain();
	createImageViews();
}`}</Code>

Here we handle minimizing by checking if width and height are zero. If it is minimized, we simply pause until window is in the foreground again.

<p>Now we recreate the swap chain when the swapchain is suboptimal or out of date by checking after acquiring an image:
<Code>{
`auto [result, imageIndex] = swapChain.acquireNextImage(UINT64_MAX, *presentCompleteSemaphores[semaphoreIndex], nullptr);

if (result == vk::Result::eErrorOutOfDateKHR) {
    recreateSwapChain();
    return;
}
if (result != vk::Result::eSuccess && result != vk::Result::eSuboptimalKHR) {
    throw std::runtime_error("failed to acquire swap chain image!");
}`}</Code>
</p>

We can then update our window to allow resizing.  
Furthermore, we will explicitly handle resizes by adding a new member <CodeFunc>bool framebufferResized = false;</CodeFunc> and a callback that updates it.

<Code>{
`void initWindow()
{
    glfwInit();

    glfwWindowHint(GLFW_CLIENT_API, GLFW_NO_API);
    glfwWindowHint(GLFW_RESIZABLE, GLFW_TRUE);

    window = glfwCreateWindow(WIDTH, HEIGHT, "Vulkan", nullptr, nullptr);
    glfwSetWindowUserPointer(window, this);
    glfwSetFramebufferSizeCallback(window, framebufferResizeCallback);
}

static void framebufferResizeCallback(GLFWwindow* window, int width, int height)
{
    auto app = reinterpret_cast<VulkanRenderer*>(glfwGetWindowUserPointer(window));
    app->framebufferResized = true;
}`}</Code>

In our draw, when we try to present we can instead do a try - catch.

<Code>{
`try
{
	const vk::PresentInfoKHR presentInfoKHR{ .waitSemaphoreCount = 1, .pWaitSemaphores = &*renderFinishedSemaphores[imageIndex], .swapchainCount = 1, .pSwapchains = &*swapChain, .pImageIndices = &imageIndex };
	result = queue.presentKHR(presentInfoKHR);
	if (result == vk::Result::eErrorOutOfDateKHR || result == vk::Result::eSuboptimalKHR || framebufferResized)
	{
		framebufferResized = false;
		recreateSwapChain();
	}
	else if (result != vk::Result::eSuccess)
	{
		throw std::runtime_error("failed to present swap chain image!");
	}
}
catch (const vk::SystemError& e)
{
	if (e.code().value() == static_cast<int>(vk::Result::eErrorOutOfDateKHR))
	{
		recreateSwapChain();
		return;
	}
	else
	{
		throw;
	}
}`}</Code>
    </div>
}