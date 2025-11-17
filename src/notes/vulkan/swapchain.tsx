import Code from "../../Code"
import CodeFunc from "../../CodeFunc"

const format = `static vk::SurfaceFormatKHR chooseSwapSurfaceFormat(std::vector<vk::SurfaceFormatKHR> const& availableFormats)
{
    assert(!availableFormats.empty());
    const auto formatIt = std::ranges::find_if(
        availableFormats,
        [](const auto& format) { return format.format == vk::Format::eB8G8R8A8Srgb && format.colorSpace == vk::ColorSpaceKHR::eSrgbNonlinear; });
    return formatIt != availableFormats.end() ? *formatIt : availableFormats[0];
}`

const present = `static vk::PresentModeKHR chooseSwapPresentMode(const std::vector<vk::PresentModeKHR>& availablePresentModes)
{
    assert(std::ranges::any_of(availablePresentModes, [](auto presentMode) { return presentMode == vk::PresentModeKHR::eFifo; }));
    return std::ranges::any_of(availablePresentModes,
        [](const vk::PresentModeKHR value) { return vk::PresentModeKHR::eMailbox == value; }) ?
        vk::PresentModeKHR::eMailbox :
        vk::PresentModeKHR::eFifo;
}
`

const extent = `vk::Extent2D chooseSwapExtent(const vk::SurfaceCapabilitiesKHR& capabilities)
{
    if (capabilities.currentExtent.width != 0xFFFFFFFF)
    {
        return capabilities.currentExtent;
    }
    int width, height;
    glfwGetFramebufferSize(window, &width, &height);

    return {
        std::clamp<uint32_t>(width, capabilities.minImageExtent.width, capabilities.maxImageExtent.width),
        std::clamp<uint32_t>(height, capabilities.minImageExtent.height, capabilities.maxImageExtent.height) };
}`

const chain = `void initVulkan() {
    createInstance();
    setupDebugMessenger();
    createSurface();
    pickPhysicalDevice();
    createLogicalDevice();
    createSwapChain();
}

void createSwapChain()
{
    auto surfaceCapabilities = physicalDevice.getSurfaceCapabilitiesKHR(*surface);
    swapChainExtent = chooseSwapExtent(surfaceCapabilities);
    swapChainSurfaceFormat = chooseSwapSurfaceFormat(physicalDevice.getSurfaceFormatsKHR(*surface));
    vk::SwapchainCreateInfoKHR swapChainCreateInfo{ .surface = *surface,
                                                    .minImageCount = chooseSwapMinImageCount(surfaceCapabilities),
                                                    .imageFormat = swapChainSurfaceFormat.format,
                                                    .imageColorSpace = swapChainSurfaceFormat.colorSpace,
                                                    .imageExtent = swapChainExtent,
                                                    .imageArrayLayers = 1,
                                                    .imageUsage = vk::ImageUsageFlagBits::eColorAttachment,
                                                    .imageSharingMode = vk::SharingMode::eExclusive,
                                                    .preTransform = surfaceCapabilities.currentTransform,
                                                    .compositeAlpha = vk::CompositeAlphaFlagBitsKHR::eOpaque,
                                                    .presentMode = chooseSwapPresentMode(physicalDevice.getSurfacePresentModesKHR(*surface)),
                                                    .clipped = true };

    swapChain = vk::raii::SwapchainKHR(device, swapChainCreateInfo);
    swapChainImages = swapChain.getImages();
}`

const members = `vk::raii::SwapchainKHR           swapChain = nullptr;
std::vector<vk::Image>           swapChainImages;
vk::SurfaceFormatKHR             swapChainSurfaceFormat;
vk::Extent2D                     swapChainExtent;
std::vector<vk::raii::ImageView> swapChainImageViews;`


const minimages = `static uint32_t chooseSwapMinImageCount(vk::SurfaceCapabilitiesKHR const& surfaceCapabilities)
{
    auto minImageCount = (std::max)(3u, surfaceCapabilities.minImageCount);
    if ((0 < surfaceCapabilities.maxImageCount) && (surfaceCapabilities.maxImageCount < minImageCount))
    {
        minImageCount = surfaceCapabilities.maxImageCount;
    }
    return minImageCount;
}`

const views = `void initVulkan() {
    createInstance();
    setupDebugMessenger();
    createSurface();
    pickPhysicalDevice();
    createLogicalDevice();
    createSwapChain();
    createImageViews();
}

void createImageViews()
{
    assert(swapChainImageViews.empty());

    vk::ImageViewCreateInfo imageViewCreateInfo{ .viewType = vk::ImageViewType::e2D, .format = swapChainSurfaceFormat.format, .subresourceRange = {vk::ImageAspectFlagBits::eColor, 0, 1, 0, 1} };
    for (auto &image : swapChainImages)
    {
        imageViewCreateInfo.image = image;
        swapChainImageViews.emplace_back(device, imageViewCreateInfo);
    }
}`

export default function Swapchain() {
    return <div>
        <p>
        Now perhaps comes a critical part of the Vulkan design. Vulkan doesn't have a default framebuffer, and we have to create an infrastructure of our own buffers. 
        In Vulkan this is known as the swap chain, but in many other terms, we can think of it as buffers for double/triple buffering. 
        It is essentially a queue of images/buffers that we have our GPU render to that will eventually be presented on our screen.
        </p>
        <p>
            In our logical device, we already check if the queue supports the swapchain extension. However, we also need to check if it is compatible with our window surface.
            This results in these settings for the swap chain. <Code>{members}</Code>The surface format or color depth. 
            <Code>
                {format}
            </Code>
            We then have the presentation mode, or how we choose to swap images. There are actually multiple presentation modes, but in this case we will use <CodeFunc>VK_PRESENT_MODE_FIFO_KHR</CodeFunc> which takes the image from the front of the image queue buffer while newly rendered images are put in the back, which results in what is commonly known as "v-sync".
            <Code>{present}</Code>
            And finally we have the swap extent, which is the resolution.
            <Code>{extent}</Code>

            We also have to decide the number of images in our swap chain.
            <Code>{minimages}</Code>

        </p>
        Now that we have all these components, we can finally create the swap chain. We also pass the handles for the swapchain images ot our vector, which we will access later.
        <Code>{chain}</Code>

        Here becomes a good place to test our validation layers. By simply removing <CodeFunc>.imageExtent = swapChainExtent</CodeFunc>, we should see a validation layer message.

        <p>
            Now to use our images, we need to create a <CodeFunc>VkImageView</CodeFunc> object. 
            <Code>{views}</Code>
        </p>
    </div>
}